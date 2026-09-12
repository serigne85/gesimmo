import { NextResponse, type NextRequest } from "next/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { estAdminOuDirection } from "@/types/roles";
import { getRapports } from "@/services/rapports";
import { renderRapportPdf } from "@/lib/pdf/rapport";
import { createClient } from "@/lib/supabase/server";
import {
  estMoisValide,
  periodeDefaut,
  type RapportPeriode,
} from "@/types/rapport";

// @react-pdf/renderer a besoin du runtime Node (pas Edge).
export const runtime = "nodejs";

/** Retient une période valide, sinon la période par défaut ; réordonne si besoin. */
function normaliserPeriode(debut: string | null, fin: string | null): RapportPeriode {
  if (!estMoisValide(debut ?? undefined) || !estMoisValide(fin ?? undefined)) {
    return periodeDefaut();
  }
  return debut! <= fin! ? { debut: debut!, fin: fin! } : { debut: fin!, fin: debut! };
}

/**
 * PDF du rapport d'activité pour une période. Réservé admin/direction (garde
 * serveur, comme la page). Protégé par la session : la RLS ne renvoie que les
 * données de l'agence connectée. Réponse en pièce jointe (téléchargement).
 */
export async function GET(request: NextRequest) {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif || !estAdminOuDirection(profil.role)) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const periode = normaliserPeriode(sp.get("debut"), sp.get("fin"));

  const rapports = await getRapports(periode);

  const supabase = await createClient();
  const { data: agence } = await supabase
    .from("agences")
    .select("nom, ville")
    .eq("id", profil.agenceId)
    .maybeSingle();

  const pdf = await renderRapportPdf(rapports, {
    nom: (agence?.nom as string) ?? "",
    ville: (agence?.ville as string | null) ?? null,
  });

  const filename = `rapport-${periode.debut}_${periode.fin}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
