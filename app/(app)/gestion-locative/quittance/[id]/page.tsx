import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { getQuittance } from "@/services/paiements";
import { formatFcfa, formatDate, formatMois } from "@/lib/utils/format";
import BoutonImprimer from "@/components/metier/BoutonImprimer";

/**
 * Quittance de loyer imprimable pour une échéance. Une quittance n'a de valeur
 * que si le mois est intégralement soldé : on la bloque tant que l'échéance n'est
 * pas au statut « payé ». Impression via le navigateur.
 */
export default async function QuittancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const q = await getQuittance(id);
  if (!q) notFound();

  const retour = (
    <Link
      href={`/gestion-locative/echeance/${q.echeanceId}`}
      className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Retour à l&apos;échéance
    </Link>
  );

  // Une quittance atteste un paiement intégral : interdite si le mois n'est pas soldé.
  if (q.statut !== "paye") {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        {retour}
        <p className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          La quittance n&apos;est disponible que lorsque le loyer du mois est
          intégralement payé. Solde restant :{" "}
          {formatFcfa(Math.max(0, q.total - q.regle))}.
        </p>
      </div>
    );
  }

  const bien = [q.bienReference, q.bienTitre, q.bienAdresse]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between print:hidden">
        {retour}
        <BoutonImprimer />
      </div>

      <div className="rounded-lg border border-zinc-300 bg-white p-6 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 print:border-0 print:text-black">
        {/* En-tête */}
        <div className="mb-4 flex items-start justify-between border-b border-zinc-200 pb-4 dark:border-zinc-700">
          <div>
            <p className="text-lg font-semibold">{q.agenceNom}</p>
            {q.agenceVille && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {q.agenceVille}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold uppercase tracking-wide">Quittance de loyer</p>
            <p className="text-sm capitalize text-zinc-500 dark:text-zinc-400">
              {formatMois(q.periode)}
            </p>
          </div>
        </div>

        {/* Corps */}
        <p className="text-sm leading-relaxed">
          {q.agenceNom}, agissant pour le compte du propriétaire, atteste que{" "}
          <span className="font-medium">{q.locataireNom}</span> a payé
          l&apos;intégralité du loyer et des charges du logement{" "}
          <span className="font-medium">{bien || q.bienReference}</span>, au titre
          du mois de <span className="capitalize">{formatMois(q.periode)}</span>.
        </p>

        {/* Détail */}
        <dl className="mt-4 space-y-2 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-700">
          <Ligne label="Loyer" valeur={formatFcfa(q.loyer)} />
          <Ligne label="Charges" valeur={formatFcfa(q.charges)} />
          <div className="flex justify-between border-t border-zinc-200 pt-2 font-semibold dark:border-zinc-700">
            <dt>Total payé</dt>
            <dd>{formatFcfa(q.total)}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          Solde restant dû pour cette période : néant.
          {q.derniereDatePaiement
            ? ` Dernier paiement reçu le ${formatDate(q.derniereDatePaiement)}.`
            : ""}
        </p>

        <div className="mt-8 flex justify-end text-xs text-zinc-500 dark:text-zinc-400">
          <span className="border-t border-zinc-400 pt-1">Signature et cachet</span>
        </div>
      </div>
    </div>
  );
}

/** Une ligne libellé / valeur de la quittance. */
function Ligne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="font-medium">{valeur}</dd>
    </div>
  );
}
