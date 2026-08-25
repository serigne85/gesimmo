import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listZones } from "@/services/reference";
import { getDemandeEdition } from "@/services/demandes";
import FormulaireDemande from "@/components/metier/FormulaireDemande";

/**
 * Écran d'édition d'une demande. Server Component : on charge en parallèle les
 * zones (référence) et la demande à modifier, puis on passe le tout au formulaire.
 */
export default async function ModifierDemandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [zones, demande] = await Promise.all([
    listZones(),
    getDemandeEdition(id),
  ]);
  if (!demande) notFound();

  const aujourdhui = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Dakar",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={`/demandes/${demande.id}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour à la demande
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Modifier la demande
      </h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulaireDemande
          zones={zones}
          aujourdhui={aujourdhui}
          demande={demande}
        />
      </div>
    </div>
  );
}
