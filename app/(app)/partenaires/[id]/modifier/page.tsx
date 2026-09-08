import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPartenaireEdition } from "@/services/partenaires";
import FormulairePartenaire from "@/components/metier/FormulairePartenaire";

/** Écran d'édition d'un partenaire. Server Component (RLS active). */
export default async function ModifierPartenairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partenaire = await getPartenaireEdition(id);
  if (!partenaire) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={`/partenaires/${id}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour au partenaire
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Modifier le partenaire
      </h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulairePartenaire partenaire={partenaire} />
      </div>
    </div>
  );
}
