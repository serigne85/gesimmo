import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { getMiseEnRelationById } from "@/services/mises-en-relation";
import { SENS_MISE_EN_RELATION_LABELS } from "@/types/mise-en-relation";
import { TYPE_PARTENAIRE_LABELS } from "@/types/partenaire";
import { formatFcfa, formatDate, telHref, whatsappHref } from "@/lib/utils/format";
import BadgeStatutMiseEnRelation from "@/components/metier/BadgeStatutMiseEnRelation";
import SuiviMiseEnRelation from "@/components/metier/SuiviMiseEnRelation";

/** Fiche détail + suivi d'une mise en relation. Server Component (RLS active). */
export default async function MiseEnRelationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mer = await getMiseEnRelationById(id);
  if (!mer) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/mises-en-relation"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux mises en relation
      </Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {mer.clientNom || "—"}
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          · {SENS_MISE_EN_RELATION_LABELS[mer.sens]}
        </span>
        <BadgeStatutMiseEnRelation statut={mer.statut} />
      </div>

      {/* Résumé de l'affaire */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Champ label="Partenaire">
            <Link
              href={`/partenaires/${mer.partenaireId}`}
              className="text-blue-800 hover:underline dark:text-blue-300"
            >
              {mer.partenaireNom}
            </Link>{" "}
            <span className="text-zinc-400">
              · {TYPE_PARTENAIRE_LABELS[mer.partenaireType]}
            </span>
          </Champ>
          {mer.demandeId ? (
            <Champ label="Demande">
              <Link
                href={`/demandes/${mer.demandeId}`}
                className="text-blue-800 hover:underline dark:text-blue-300"
              >
                Voir la demande
              </Link>
            </Champ>
          ) : mer.bienId ? (
            <Champ label="Bien">
              <Link
                href={`/biens/${mer.bienId}`}
                className="text-blue-800 hover:underline dark:text-blue-300"
              >
                {mer.bienTitre || mer.bienReference || "Voir le bien"}
              </Link>
            </Champ>
          ) : (
            <Champ label="Rattachement">—</Champ>
          )}
          <Champ label="Commission totale">
            {formatFcfa(mer.commissionTotale)}
          </Champ>
          <Champ label="Part M2S (prévue)">{formatFcfa(mer.partAgence)}</Champ>
          <Champ label="Part partenaire">
            {formatFcfa(mer.partPartenaire)}
          </Champ>
          <Champ label="Commission encaissée">
            {mer.commissionPercue !== null ? (
              <span className="font-medium text-green-700 dark:text-green-400">
                {formatFcfa(mer.commissionPercue)}
              </span>
            ) : (
              "—"
            )}
          </Champ>
          <Champ label="Soumise le">{formatDate(mer.dateSoumission)}</Champ>
          <Champ label="Conclue le">
            {mer.dateConclusion ? formatDate(mer.dateConclusion) : "—"}
          </Champ>
          {mer.bienPropose && (
            <div className="sm:col-span-2">
              <Champ
                label={
                  mer.sens === "entrante"
                    ? "Client du partenaire"
                    : "Produit proposé"
                }
              >
                <span className="whitespace-pre-line">{mer.bienPropose}</span>
              </Champ>
            </div>
          )}
        </dl>
      </div>

      {/* Contact rapide du client (sens sortante : le client est chez nous) */}
      {mer.clientTelephone && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Client
          </h2>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                {mer.clientNom || "—"}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {mer.clientTelephone}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={telHref(mer.clientTelephone)}
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title={`Appeler ${mer.clientTelephone}`}
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={whatsappHref(mer.clientTelephone)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Suivi : statut, journal, commission */}
      <SuiviMiseEnRelation id={mer.id} statut={mer.statut} suivi={mer.suivi} />
    </div>
  );
}

/** Une paire libellé / valeur. */
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
