import { NextResponse, type NextRequest } from "next/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { getSituationProprietaire } from "@/services/situations";
import { createClient } from "@/lib/supabase/server";
import { renderSituationPdf } from "@/lib/pdf/situation";
import { moisCourant } from "@/types/suivi";

// @react-pdf/renderer a besoin du runtime Node (pas Edge).
export const runtime = "nodejs";

/** Transforme un nom en fragment de nom de fichier sûr. */
function slug(nom: string): string {
  return (
    nom
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // enlève les accents combinants
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "proprietaire"
  );
}

/**
 * PDF de la situation locative d'un propriétaire pour un mois. Protégée par la
 * session (RLS) : le service ne renvoie que les données de l'agence connectée.
 * Réponse en pièce jointe (téléchargement) ; le bouton « Partager » récupère le
 * même flux pour le joindre dans WhatsApp.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const { id } = await params;
  const moisParam = request.nextUrl.searchParams.get("mois") ?? "";
  const mois = /^\d{4}-\d{2}$/.test(moisParam) ? moisParam : moisCourant();

  const situation = await getSituationProprietaire(id, mois);
  if (!situation) {
    return new NextResponse("Propriétaire introuvable", { status: 404 });
  }

  const supabase = await createClient();
  const { data: agence } = await supabase
    .from("agences")
    .select("nom, ville")
    .eq("id", profil.agenceId)
    .maybeSingle();

  const pdf = await renderSituationPdf(situation, {
    nom: (agence?.nom as string) ?? "",
    ville: (agence?.ville as string | null) ?? null,
  });

  const filename = `situation-${slug(situation.proprietaireNom)}-${mois}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
