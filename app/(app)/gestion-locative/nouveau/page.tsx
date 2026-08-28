import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listBiensLouables } from "@/services/baux";
import FormulaireBail from "@/components/metier/FormulaireBail";

/**
 * Écran de création d'un bail. Server Component : on charge les biens louables
 * côté serveur (RLS), puis on les passe au formulaire client.
 */
export default async function NouveauBailPage() {
  const biens = await listBiensLouables();
  // Date du jour en Africa/Dakar (AAAA-MM-JJ), calculée côté serveur pour que le
  // pré-remplissage du formulaire soit stable (pas de décalage d'hydratation).
  const aujourdhui = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Dakar",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/gestion-locative"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux baux
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Nouveau bail
      </h1>

      {biens.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucun bien en location disponible. Saisissez d&apos;abord un bien avec
          l&apos;objectif « location ».
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <FormulaireBail biens={biens} aujourdhui={aujourdhui} />
        </div>
      )}
    </div>
  );
}
