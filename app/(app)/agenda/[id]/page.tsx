import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle, Pencil, Building2 } from "lucide-react";
import { getRendezVousById } from "@/services/rendez-vous";
import { TYPE_RENDEZ_VOUS_LABELS, NIVEAU_INTERET_LABELS } from "@/types/rendez-vous";
import { formatDateHeure, formatHeure, telHref, whatsappHref } from "@/lib/utils/format";
import BadgeStatutRendezVous from "@/components/metier/BadgeStatutRendezVous";
import ActionsRendezVous from "@/components/metier/ActionsRendezVous";
import FormulaireCompteRendu from "@/components/metier/FormulaireCompteRendu";

/** Fiche détail d'un rendez-vous. Server Component (RLS active). */
export default async function RendezVousDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rdv = await getRendezVousById(id);
  if (!rdv) notFound();

  const estVisite = rdv.type === "visite";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/agenda"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour à l&apos;agenda
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {rdv.titre}
          </h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            · {TYPE_RENDEZ_VOUS_LABELS[rdv.type]}
          </span>
          <BadgeStatutRendezVous statut={rdv.statut} />
        </div>
        <Link
          href={`/agenda/${rdv.id}/modifier`}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Modifier
        </Link>
      </div>

      {/* Détails */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Champ label="Début">{formatDateHeure(rdv.debut)}</Champ>
          <Champ label="Fin">{rdv.fin ? formatHeure(rdv.fin) : "—"}</Champ>
          <Champ label="Lieu">{rdv.lieu ?? "—"}</Champ>
          <Champ label="Assigné à">{rdv.assigneeNom ?? "—"}</Champ>
          {rdv.bienId && (
            <div className="sm:col-span-2">
              <Champ label="Bien">
                <Link
                  href={`/biens/${rdv.bienId}`}
                  className="inline-flex items-center gap-1 text-blue-800 hover:underline dark:text-blue-300"
                >
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {rdv.bienReference ?? "Voir le bien"}
                </Link>
              </Champ>
            </div>
          )}
          {rdv.notes && (
            <div className="sm:col-span-2">
              <Champ label="Notes">
                <span className="whitespace-pre-line">{rdv.notes}</span>
              </Champ>
            </div>
          )}
        </dl>
      </div>

      {/* Client */}
      {rdv.contactTelephone && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Client
          </h2>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                {rdv.contactNom || "—"}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {rdv.contactTelephone}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={telHref(rdv.contactTelephone)}
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title={`Appeler ${rdv.contactTelephone}`}
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={whatsappHref(rdv.contactTelephone)}
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

      {/* Statut */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Statut
        </h2>
        <ActionsRendezVous id={rdv.id} statut={rdv.statut} />
      </div>

      {/* Compte rendu (visites uniquement) */}
      {estVisite && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Compte rendu de visite
          </h2>
          {rdv.compteRendu && (
            <p className="mb-3 text-xs text-zinc-400">
              Intérêt :{" "}
              {rdv.compteRendu.interesse === true
                ? "oui"
                : rdv.compteRendu.interesse === false
                  ? "non"
                  : "—"}
              {rdv.compteRendu.niveauInteret
                ? ` · ${NIVEAU_INTERET_LABELS[rdv.compteRendu.niveauInteret]}`
                : ""}
            </p>
          )}
          <FormulaireCompteRendu
            rendezVousId={rdv.id}
            compteRendu={rdv.compteRendu}
          />
        </div>
      )}
    </div>
  );
}

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
