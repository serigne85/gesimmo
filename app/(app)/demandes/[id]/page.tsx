import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle, Pencil } from "lucide-react";
import { getDemandeById } from "@/services/demandes";
import { biensCorrespondants } from "@/services/matching";
import { OBJECTIF_DEMANDE_LABELS } from "@/types/demande";
import { TYPE_BIEN_LABELS } from "@/types/bien";
import { formatFcfa, formatDate, telHref, whatsappHref } from "@/lib/utils/format";
import BadgeStatutDemande from "@/components/metier/BadgeStatutDemande";
import BiensCorrespondants from "@/components/metier/BiensCorrespondants";

/** Fiche détail d'une demande. Server Component (RLS active). */
export default async function DemandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const demande = await getDemandeById(id);
  if (!demande) notFound();

  const biens = await biensCorrespondants({
    objectif: demande.objectif,
    zoneIds: demande.zones.map((z) => z.id),
    types: demande.types,
    budgetMin: demande.budgetMin,
    budgetMax: demande.budgetMax,
    nombreChambresMin: demande.nombreChambresMin,
    surfaceMin: demande.surfaceMin,
  });

  const budget =
    demande.budgetMin !== null && demande.budgetMax !== null
      ? `${formatFcfa(demande.budgetMin)} – ${formatFcfa(demande.budgetMax)}`
      : demande.budgetMax !== null
        ? `≤ ${formatFcfa(demande.budgetMax)}`
        : demande.budgetMin !== null
          ? `≥ ${formatFcfa(demande.budgetMin)}`
          : "Non précisé";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/demandes"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux demandes
      </Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {demande.clientNom || "—"}
          </h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            · {OBJECTIF_DEMANDE_LABELS[demande.objectif]}
          </span>
          <BadgeStatutDemande statut={demande.statut} />
        </div>
        <Link
          href={`/demandes/${demande.id}/modifier`}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Modifier
        </Link>
      </div>

      {/* Critères */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Champ label="Budget">{budget}</Champ>
          <Champ label="Date de la demande">{formatDate(demande.dateDemande)}</Champ>
          <Champ label="Échéance">
            {demande.dateEcheance ? formatDate(demande.dateEcheance) : "—"}
          </Champ>
          <Champ label="Chambres min">{demande.nombreChambresMin ?? "—"}</Champ>
          <Champ label="Surface min">
            {demande.surfaceMin ? `${demande.surfaceMin} m²` : "—"}
          </Champ>
          <div className="sm:col-span-2">
            <Champ label="Types recherchés">
              {demande.types.length > 0
                ? demande.types.map((t) => TYPE_BIEN_LABELS[t]).join(", ")
                : "Tous"}
            </Champ>
          </div>
          <div className="sm:col-span-2">
            <Champ label="Zones ciblées">
              {demande.zones.length > 0
                ? demande.zones.map((z) => z.nom).join(", ")
                : "Toutes"}
            </Champ>
          </div>
          {demande.notes && (
            <div className="sm:col-span-2">
              <Champ label="Notes">
                <span className="whitespace-pre-line">{demande.notes}</span>
              </Champ>
            </div>
          )}
        </dl>
      </div>

      {/* Biens correspondants (matching) */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Biens correspondants ({biens.length})
        </h2>
        <BiensCorrespondants biens={biens} />
      </div>

      {/* Client */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Client
        </h2>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
              {demande.clientNom || "—"}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {demande.clientTelephone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={telHref(demande.clientTelephone)}
              className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title={`Appeler ${demande.clientTelephone}`}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={whatsappHref(demande.clientTelephone)}
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
