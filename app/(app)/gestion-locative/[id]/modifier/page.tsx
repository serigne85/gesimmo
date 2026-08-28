import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBailById } from "@/services/baux";
import FormulaireEditionBail from "@/components/metier/FormulaireEditionBail";

/**
 * Édition d'un bail. Réservée aux baux en brouillon (après activation, les
 * échéances sont figées) : sinon on renvoie vers la fiche. Server Component.
 */
export default async function ModifierBailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bail = await getBailById(id);
  if (!bail) notFound();
  if (bail.statut !== "brouillon") redirect(`/gestion-locative/${id}`);

  const bienLabel = `${bail.bienReference}${bail.bienTitre ? ` — ${bail.bienTitre}` : ""}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={`/gestion-locative/${id}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour au bail
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Modifier le bail
      </h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulaireEditionBail
          bailId={bail.id}
          bienLabel={bienLabel}
          locataireNom={bail.locataireNom}
          defauts={{
            loyerMensuel: bail.loyerMensuel,
            chargesMensuelles: bail.chargesMensuelles,
            cautionMois: bail.cautionMois,
            jourEcheance: bail.jourEcheance,
            modePaiement: bail.modePaiement,
            dateDebut: bail.dateDebut,
            dateFin: bail.dateFin,
            notes: bail.notes,
          }}
        />
      </div>
    </div>
  );
}
