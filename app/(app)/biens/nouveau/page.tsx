import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listZones } from "@/services/reference";
import FormulaireBien from "@/components/metier/FormulaireBien";

/**
 * Écran de saisie d'un bien. Server Component : on charge les zones (référence)
 * côté serveur, puis on les passe au formulaire client.
 */
export default async function NouveauBienPage() {
  const zones = await listZones();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
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
        <FormulaireBien zones={zones} />
      </div>
    </div>
  );
}
