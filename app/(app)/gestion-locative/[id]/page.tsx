import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle, Pencil } from "lucide-react";
import { getBailById } from "@/services/baux";
import { getEcheancesBail } from "@/services/echeances";
import { listReversementsBail } from "@/services/reversements";
import {
  MODE_PAIEMENT_LABELS,
  loyerTotal,
  montantCaution,
} from "@/types/bail";
import { TYPE_MANDAT_LABELS } from "@/types/mandat";
import { commissionSuggeree } from "@/types/reversement";
import { formatFcfa, formatDate, formatMois, telHref, whatsappHref } from "@/lib/utils/format";
import BadgeStatutBail from "@/components/metier/BadgeStatutBail";
import BadgeStatutBien from "@/components/metier/BadgeStatutBien";
import ActionsStatutBail from "@/components/metier/ActionsStatutBail";
import TableauEcheances from "@/components/metier/TableauEcheances";
import FormulaireReversement from "@/components/metier/FormulaireReversement";
import BoutonAnnulerReversement from "@/components/metier/BoutonAnnulerReversement";

/**
 * Fiche détail d'un bail. Server Component : chargé côté serveur (RLS active).
 * Porte les transitions de statut (activation, résiliation…) qui synchronisent
 * le statut du bien.
 */
export default async function BailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bail = await getBailById(id);
  if (!bail) notFound();

  const echeances = await getEcheancesBail(bail.id);
  const reversements =
    bail.statut === "actif" ? await listReversementsBail(bail.id) : [];
  // Date du jour en Africa/Dakar (AAAA-MM-JJ) pour dériver « en retard ».
  const aujourdhui = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Dakar",
  });

  const caution = montantCaution(bail.loyerMensuel, bail.cautionMois);
  const commissionDefaut = commissionSuggeree(
    bail.loyerMensuel,
    bail.mandatCommissionValeur,
    bail.mandatCommissionUnite
  );
  const periode = [bail.dateDebut, bail.dateFin]
    .map((d) => (d ? formatDate(d) : null))
    .filter(Boolean)
    .join(" → ");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/gestion-locative"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux baux
      </Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {bail.reference}
          </span>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {bail.locataireNom}
          </h1>
          <BadgeStatutBail statut={bail.statut} />
        </div>
        {bail.statut === "brouillon" && (
          <Link
            href={`/gestion-locative/${bail.id}/modifier`}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Modifier
          </Link>
        )}
      </div>

      {/* Conditions financières */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Champ label="Loyer mensuel">{formatFcfa(bail.loyerMensuel)}</Champ>
          <Champ label="Charges mensuelles">
            {formatFcfa(bail.chargesMensuelles)}
          </Champ>
          <Champ label="Total mensuel dû">
            {formatFcfa(loyerTotal(bail.loyerMensuel, bail.chargesMensuelles))}
          </Champ>
          <Champ label="Caution">
            {bail.cautionMois
              ? `${bail.cautionMois} mois · ${formatFcfa(caution)}`
              : "—"}
          </Champ>
          <Champ label="Jour d'échéance">Le {bail.jourEcheance} du mois</Champ>
          <Champ label="Mode de paiement">
            {bail.modePaiement ? MODE_PAIEMENT_LABELS[bail.modePaiement] : "—"}
          </Champ>
          <Champ label="Période">{periode || "Non précisée"}</Champ>
          <Champ label="Créé le">{formatDate(bail.creeLe)}</Champ>
          {bail.notes && (
            <div className="sm:col-span-2">
              <Champ label="Notes">
                <span className="whitespace-pre-line">{bail.notes}</span>
              </Champ>
            </div>
          )}
        </dl>
      </div>

      {/* Cycle de vie */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Cycle de vie
          </h2>
          <BadgeStatutBail statut={bail.statut} />
        </div>
        <ActionsStatutBail id={bail.id} statut={bail.statut} />
      </div>

      {/* Échéances de loyer */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Échéances de loyer ({echeances.length})
        </h2>
        <TableauEcheances echeances={echeances} aujourdhui={aujourdhui} />
      </div>

      {/* Reversement au propriétaire (gérance) — baux actifs uniquement */}
      {bail.statut === "actif" && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Reversement au propriétaire
          </h2>
          <p className="mb-3 text-xs text-zinc-400">
            Gérance : loyer encaissé − commission de l&apos;agence = net reversé.
          </p>
          <FormulaireReversement
            bailId={bail.id}
            echeances={echeances.map((e) => ({
              periode: e.periode,
              montantRegle: e.montantRegle,
            }))}
            commissionSuggeree={commissionDefaut}
            aujourdhui={aujourdhui}
          />

          {reversements.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Historique ({reversements.length})
              </h3>
              <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {reversements.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">
                        {formatMois(r.periode)}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Loyer {formatFcfa(r.montantLoyer)} · commission{" "}
                        {formatFcfa(r.commission)} · {formatDate(r.dateReversement)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        {formatFcfa(r.montantReverse)}
                      </span>
                      <BoutonAnnulerReversement id={r.id} bailId={bail.id} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bien loué */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Bien loué
        </h2>
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/biens/${bail.bienId}`}
            className="min-w-0 hover:underline"
          >
            <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
              {bail.bienReference}
              {bail.bienTitre ? ` · ${bail.bienTitre}` : ""}
            </p>
          </Link>
          <BadgeStatutBien statut={bail.bienStatut} />
        </div>
      </div>

      {/* Mandat rattaché (optionnel) */}
      {bail.mandatId && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Mandat rattaché
          </h2>
          <p className="text-sm text-zinc-900 dark:text-zinc-100">
            {bail.mandatReference}
            {bail.mandatType ? ` · ${TYPE_MANDAT_LABELS[bail.mandatType]}` : ""}
          </p>
        </div>
      )}

      {/* Locataire */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Locataire
        </h2>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
              {bail.locataireNom || "—"}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {bail.locataireTelephone}
            </p>
          </div>
          {bail.locataireTelephone && (
            <div className="flex items-center gap-2">
              <a
                href={telHref(bail.locataireTelephone)}
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title={`Appeler ${bail.locataireTelephone}`}
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={whatsappHref(bail.locataireTelephone)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Une paire libellé / valeur de la fiche. */
function Champ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">
        {children}
      </dd>
    </div>
  );
}
