import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle, Mail, Pencil } from "lucide-react";
import { getPartenaireById } from "@/services/partenaires";
import { TYPE_PARTENAIRE_LABELS } from "@/types/partenaire";
import { telHref, whatsappHref } from "@/lib/utils/format";

/** Fiche détail d'un partenaire. Server Component (RLS active). */
export default async function PartenaireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partenaire = await getPartenaireById(id);
  if (!partenaire) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/partenaires"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux partenaires
      </Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {partenaire.nom}
          </h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            · {TYPE_PARTENAIRE_LABELS[partenaire.type]}
          </span>
          {partenaire.actif ? (
            <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
              Actif
            </span>
          ) : (
            <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Inactif
            </span>
          )}
        </div>
        <Link
          href={`/partenaires/${partenaire.id}/modifier`}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Modifier
        </Link>
      </div>

      {/* Informations */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Champ label="Type">{TYPE_PARTENAIRE_LABELS[partenaire.type]}</Champ>
          <Champ label="Commission habituelle">
            {partenaire.tauxCommissionDefaut !== null
              ? `${partenaire.tauxCommissionDefaut} %`
              : "—"}
          </Champ>
          <Champ label="Téléphone">{partenaire.telephone ?? "—"}</Champ>
          <Champ label="E-mail">{partenaire.email ?? "—"}</Champ>
          {partenaire.notes && (
            <div className="sm:col-span-2">
              <Champ label="Notes">
                <span className="whitespace-pre-line">{partenaire.notes}</span>
              </Champ>
            </div>
          )}
        </dl>

        {(partenaire.telephone || partenaire.email) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            {partenaire.telephone && (
              <>
                <a
                  href={telHref(partenaire.telephone)}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Appeler
                </a>
                <a
                  href={whatsappHref(partenaire.telephone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 dark:border-zinc-700 dark:text-green-400 dark:hover:bg-green-950"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </>
            )}
            {partenaire.email && (
              <a
                href={`mailto:${partenaire.email}`}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                E-mail
              </a>
            )}
          </div>
        )}
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
