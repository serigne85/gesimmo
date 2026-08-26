import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listZones } from "@/services/reference";
import { getProspectionEdition } from "@/services/prospections";
import FormulaireProspection from "@/components/metier/FormulaireProspection";

/**
 * Écran d'édition d'une prospection. Server Component : on charge la prospection
 * (RLS : forcément dans l'agence) et les zones, puis on pré-remplit le
 * formulaire. Introuvable / supprimée / hors agence → 404.
 */
export default async function EditionProspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [prospection, zones] = await Promise.all([
    getProspectionEdition(id),
    listZones(),
  ]);
  if (!prospection) notFound();

  const aujourdhui = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Dakar",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/prospects"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux prospects
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Modifier la prospection
      </h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulaireProspection
          zones={zones}
          aujourdhui={aujourdhui}
          prospection={prospection}
        />
      </div>
    </div>
  );
}
