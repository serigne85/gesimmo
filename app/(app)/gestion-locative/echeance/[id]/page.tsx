import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt, FileCheck } from "lucide-react";
import { getEcheanceDetail } from "@/services/paiements";
import {
  situationEcheance,
  resteEcheance,
} from "@/types/echeance";
import { MODE_PAIEMENT_LABELS } from "@/types/bail";
import { formatFcfa, formatDate, formatMois } from "@/lib/utils/format";
import BadgeSituationEcheance from "@/components/metier/BadgeSituationEcheance";
import FormulairePaiement from "@/components/metier/FormulairePaiement";
import BoutonAnnulerPaiement from "@/components/metier/BoutonAnnulerPaiement";

/**
 * Écran d'encaissement d'une échéance : montants (dû / réglé / reste), formulaire
 * de paiement et historique des paiements. Server Component (RLS active).
 */
export default async function EcheancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const echeance = await getEcheanceDetail(id);
  if (!echeance) notFound();

  const aujourdhui = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Dakar",
  });
  const situation = situationEcheance(
    echeance.statut,
    echeance.dateEcheance,
    aujourdhui
  );
  const reste = resteEcheance(echeance.montantDu, echeance.montantRegle);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={`/gestion-locative/${echeance.bailId}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour au bail
      </Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {echeance.bailReference}
        </span>
        <h1 className="text-xl font-semibold capitalize text-zinc-900 dark:text-zinc-100">
          Loyer {formatMois(echeance.periode)}
        </h1>
        <BadgeSituationEcheance situation={situation} />
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {echeance.locataireNom} · {echeance.bienReference}
        {echeance.bienTitre ? ` · ${echeance.bienTitre}` : ""}
      </p>

      {/* Montants */}
      <div className="grid grid-cols-3 gap-3">
        <Chiffre label="Dû" valeur={formatFcfa(echeance.montantDu)} />
        <Chiffre label="Réglé" valeur={formatFcfa(echeance.montantRegle)} />
        <Chiffre
          label="Reste"
          valeur={formatFcfa(reste)}
          accent={reste > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}
        />
      </div>

      {/* Quittance : seulement si le mois est soldé */}
      {echeance.statut === "paye" && (
        <Link
          href={`/gestion-locative/quittance/${echeance.id}`}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <FileCheck className="h-4 w-4" aria-hidden="true" />
          Quittance de loyer
        </Link>
      )}

      {/* Enregistrer un paiement */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Enregistrer un paiement
        </h2>
        <FormulairePaiement
          echeanceId={echeance.id}
          resteSuggere={reste}
          aujourdhui={aujourdhui}
        />
      </div>

      {/* Historique des paiements */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Paiements ({echeance.paiements.length})
        </h2>
        {echeance.paiements.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Aucun paiement enregistré.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {echeance.paiements.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {formatFcfa(p.montant)}
                    <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {MODE_PAIEMENT_LABELS[p.mode]}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDate(p.datePaiement)}
                    {p.referenceTransaction ? ` · ${p.referenceTransaction}` : ""}
                    {p.encaisseParNom ? ` · ${p.encaisseParNom}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/gestion-locative/recu/${p.id}`}
                    title="Reçu"
                    className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-blue-800 dark:hover:bg-zinc-800"
                  >
                    <Receipt className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <BoutonAnnulerPaiement id={p.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Une tuile chiffrée (dû / réglé / reste). */
function Chiffre({
  label,
  valeur,
  accent,
}: {
  label: string;
  valeur: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${accent ?? "text-zinc-900 dark:text-zinc-100"}`}>
        {valeur}
      </p>
    </div>
  );
}
