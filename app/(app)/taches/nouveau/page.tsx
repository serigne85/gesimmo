import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUtilisateurConnecte } from "@/services/auth";
import { listUtilisateursOptions } from "@/services/utilisateurs";
import { LIEN_TACHE_LABELS, type LienTache } from "@/types/tache";
import FormulaireTache, {
  type PrefillTache,
} from "@/components/metier/FormulaireTache";

/**
 * Création d'une tâche. Server Component : on charge les utilisateurs de l'agence
 * (pour l'assignation). Un préremplissage optionnel (lienType/lienId/titre) via
 * l'URL permet de créer une tâche déjà rattachée depuis une fiche métier.
 */
export default async function NouvelleTachePage({
  searchParams,
}: {
  searchParams: Promise<{ lienType?: string; lienId?: string; titre?: string }>;
}) {
  const sp = await searchParams;
  const profil = await getUtilisateurConnecte();
  const utilisateurs = profil
    ? await listUtilisateursOptions(profil.agenceId)
    : [];

  const lienType =
    sp.lienType && sp.lienType in LIEN_TACHE_LABELS
      ? (sp.lienType as LienTache)
      : undefined;
  const prefill: PrefillTache | undefined =
    lienType && sp.lienId
      ? { lienType, lienId: sp.lienId, titre: sp.titre }
      : sp.titre
        ? { titre: sp.titre }
        : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/taches"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux tâches
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Nouvelle tâche
      </h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulaireTache utilisateurs={utilisateurs} prefill={prefill} />
      </div>
    </div>
  );
}
