import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listBiensSelectionnables } from "@/services/mandats";
import FormulaireMandat from "@/components/metier/FormulaireMandat";

/**
 * Écran de création d'un mandat. Server Component : on charge les biens
 * éligibles côté serveur (RLS), puis on les passe au formulaire client.
 */
export default async function NouveauMandatPage() {
  const biens = await listBiensSelectionnables();
  // Date du jour en Africa/Dakar (AAAA-MM-JJ), calculée côté serveur pour que le
  // pré-remplissage du formulaire soit stable (pas de décalage d'hydratation).
  const aujourdhui = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Dakar",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/mandats"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux mandats
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Nouveau mandat
      </h1>

      {biens.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucun bien éligible. Saisissez d&apos;abord un bien.
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <FormulaireMandat biens={biens} aujourdhui={aujourdhui} />
        </div>
      )}
    </div>
  );
}
