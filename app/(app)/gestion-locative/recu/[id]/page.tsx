import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRecu } from "@/services/paiements";
import { MODE_PAIEMENT_LABELS } from "@/types/bail";
import { formatFcfa, formatDate, formatMois } from "@/lib/utils/format";
import BoutonImprimer from "@/components/metier/BoutonImprimer";

/**
 * Reçu de paiement imprimable. Server Component (RLS active) ; l'impression passe
 * par le navigateur (BoutonImprimer). Le numéro de reçu reprend le début de l'id.
 */
export default async function RecuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recu = await getRecu(id);
  if (!recu) notFound();

  const numero = recu.id.slice(0, 8).toUpperCase();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/gestion-locative`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Gestion locative
        </Link>
        <BoutonImprimer />
      </div>

      {/* Le reçu lui-même */}
      <div className="rounded-lg border border-zinc-300 bg-white p-6 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 print:border-0 print:text-black">
        <div className="mb-4 flex items-start justify-between border-b border-zinc-200 pb-4 dark:border-zinc-700">
          <div>
            <p className="text-lg font-semibold">{recu.agenceNom}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Reçu de paiement
            </p>
          </div>
          <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
            <p>N° {numero}</p>
            <p>{formatDate(recu.datePaiement)}</p>
          </div>
        </div>

        <dl className="space-y-2 text-sm">
          <Ligne label="Locataire" valeur={recu.locataireNom} />
          <Ligne
            label="Bien"
            valeur={`${recu.bienReference}${recu.bienTitre ? ` · ${recu.bienTitre}` : ""}`}
          />
          <Ligne label="Bail" valeur={recu.bailReference} />
          <Ligne label="Période" valeur={formatMois(recu.periode)} capitalize />
          <Ligne label="Mode de paiement" valeur={MODE_PAIEMENT_LABELS[recu.mode]} />
          {recu.referenceTransaction && (
            <Ligne label="Référence" valeur={recu.referenceTransaction} />
          )}
        </dl>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Montant reçu
          </span>
          <span className="text-lg font-semibold">{formatFcfa(recu.montant)}</span>
        </div>

        {recu.resteMois > 0 && (
          <p className="mt-2 text-right text-xs text-amber-700 dark:text-amber-400">
            Reste à payer sur ce mois : {formatFcfa(recu.resteMois)}
          </p>
        )}

        <div className="mt-8 flex items-end justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {recu.encaisseParNom ? `Encaissé par ${recu.encaisseParNom}` : ""}
          </span>
          <span className="border-t border-zinc-400 pt-1">Signature et cachet</span>
        </div>
      </div>
    </div>
  );
}

/** Une ligne libellé / valeur du reçu. */
function Ligne({
  label,
  valeur,
  capitalize,
}: {
  label: string;
  valeur: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className={`text-right font-medium ${capitalize ? "capitalize" : ""}`}>
        {valeur}
      </dd>
    </div>
  );
}
