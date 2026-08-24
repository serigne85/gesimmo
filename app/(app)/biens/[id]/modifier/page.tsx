import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listZones } from "@/services/reference";
import { getBienEdition } from "@/services/biens";
import FormulaireBien from "@/components/metier/FormulaireBien";

/**
 * Écran d'édition d'un bien. Server Component : on charge en parallèle les zones
 * (référence) et le bien à modifier, puis on passe le tout au formulaire.
 */
export default async function ModifierBienPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [zones, bien] = await Promise.all([listZones(), getBienEdition(id)]);
  if (!bien) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={`/biens/${bien.id}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour à la fiche
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {bien.reference}
        </span>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Modifier le bien
        </h1>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulaireBien zones={zones} bien={bien} />
      </div>
    </div>
  );
}
