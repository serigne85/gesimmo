import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUtilisateurConnecte } from "@/services/auth";
import { peutGererModeles } from "@/types/roles";
import { listModelesMandats } from "@/services/modeles-mandats";
import { VARIABLES_CONTRAT } from "@/lib/contrats/variables";
import EditeurModelesMandats from "@/components/metier/EditeurModelesMandats";

/**
 * Édition des modèles de contrat de mandat. Réservé admin/direction : le
 * contrôle est fait ici (page) ET dans l'action d'enregistrement.
 */
export default async function ModelesMandatsPage() {
  const profil = await getUtilisateurConnecte();
  const autorise = !!profil && peutGererModeles(profil.role);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link
        href="/mandats"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux mandats
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Modèles de contrat
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Le texte des articles par nature de mandat, avec des variables {`{{…}}`}
          remplies à la génération du PDF.
        </p>
      </div>

      {!autorise ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Réservé aux rôles administrateur et direction.
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <EditeurModelesMandats
            modeles={await listModelesMandats()}
            variables={VARIABLES_CONTRAT}
          />
        </div>
      )}
    </div>
  );
}
