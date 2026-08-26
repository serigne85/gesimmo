import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listZones } from "@/services/reference";
import { getUtilisateurConnecte } from "@/services/auth";
import { getProspectionEdition } from "@/services/prospections";
import { peutGererReference } from "@/types/roles";
import FormulaireBien, {
  type PrefillBien,
} from "@/components/metier/FormulaireBien";

/**
 * Écran de saisie d'un bien. Server Component : on charge les zones (référence)
 * côté serveur, puis on les passe au formulaire client. Si `?prospection=<id>`
 * est présent (bouton « Ajouter aux biens »), on pré-remplit le formulaire à
 * partir de la prospection — sans la modifier ni la lier.
 */
export default async function NouveauBienPage({
  searchParams,
}: {
  searchParams: Promise<{ prospection?: string }>;
}) {
  const sp = await searchParams;
  const [zones, profil] = await Promise.all([
    listZones(),
    getUtilisateurConnecte(),
  ]);
  const peutAjouterReference = !!profil && peutGererReference(profil.role);

  // Pré-remplissage éventuel depuis une prospection « disponible ».
  let prefill: PrefillBien | undefined;
  if (sp.prospection) {
    const p = await getProspectionEdition(sp.prospection);
    if (p) {
      const villeId = p.zoneId
        ? zones.find((z) => z.id === p.zoneId)?.villeId
        : undefined;
      // Indice d'objectif à partir du produit prospecté (l'agent peut corriger).
      const produitBas = (p.produit ?? "").toLowerCase();
      const objectif = /(location|louer)/.test(produitBas)
        ? ("location" as const)
        : undefined;
      prefill = {
        titre: p.produit ?? undefined,
        objectif,
        villeId,
        zoneId: p.zoneId ?? undefined,
        proprietaireNom: p.nomComplet,
        proprietaireTelephone: p.telephone,
        contactNom: p.contactNom ?? undefined,
        contactTelephone: p.contactTel ?? undefined,
      };
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link
        href="/biens"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux biens
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Nouveau bien
      </h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulaireBien
          zones={zones}
          prefill={prefill}
          peutAjouterReference={peutAjouterReference}
        />
      </div>
    </div>
  );
}
