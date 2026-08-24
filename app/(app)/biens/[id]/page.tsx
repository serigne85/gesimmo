import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { getBienById } from "@/services/biens";
import {
  TYPE_BIEN_LABELS,
  OBJECTIF_LABELS,
  STATUT_JURIDIQUE_LABELS,
} from "@/types/bien";
import { formatFcfa, formatDate, telHref, whatsappHref } from "@/lib/utils/format";
import BadgeStatutBien from "@/components/metier/BadgeStatutBien";

/**
 * Fiche détail d'un bien. Server Component : chargé côté serveur (RLS active).
 * Le segment dynamique [id] fournit l'identifiant via params.
 */
export default async function BienDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bien = await getBienById(id);
  if (!bien) notFound();

  const lieu = [bien.zoneNom, bien.villeNom].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/biens"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux biens
      </Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {bien.reference}
        </span>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {TYPE_BIEN_LABELS[bien.type]}
        </h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          · {OBJECTIF_LABELS[bien.objectif]}
        </span>
        <BadgeStatutBien statut={bien.statut} />
      </div>

      {/* Caractéristiques */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Champ label="Prix">{formatFcfa(bien.prix)}</Champ>
          <Champ label="Localisation">{lieu || "Non précisée"}</Champ>
          <Champ label="Statut juridique">
            {bien.statutJuridique
              ? STATUT_JURIDIQUE_LABELS[bien.statutJuridique]
              : "Non renseigné"}
          </Champ>
          <Champ label="Saisi le">{formatDate(bien.creeLe)}</Champ>
          {bien.description && (
            <div className="sm:col-span-2">
              <Champ label="Description">
                <span className="whitespace-pre-line">{bien.description}</span>
              </Champ>
            </div>
          )}
        </dl>
      </div>

      {/* Propriétaire */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Propriétaire
        </h2>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
              {bien.proprietaireNom || "—"}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {bien.proprietaireTelephone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={telHref(bien.proprietaireTelephone)}
              className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title={`Appeler ${bien.proprietaireTelephone}`}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={whatsappHref(bien.proprietaireTelephone)}
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
