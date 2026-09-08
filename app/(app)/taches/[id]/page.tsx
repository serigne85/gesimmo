import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, ExternalLink } from "lucide-react";
import { getTacheById } from "@/services/taches";
import {
  TYPE_TACHE_LABELS,
  PRIORITE_TACHE_LABELS,
  LIEN_TACHE_BASE,
  LIEN_TACHE_LABELS,
} from "@/types/tache";
import { formatDate } from "@/lib/utils/format";
import BadgeStatutTache from "@/components/metier/BadgeStatutTache";

/** Fiche détail d'une tâche. Server Component (RLS active). */
export default async function TacheDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tache = await getTacheById(id);
  if (!tache) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/taches"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux tâches
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {tache.titre}
          </h1>
          <BadgeStatutTache statut={tache.statut} />
        </div>
        <Link
          href={`/taches/${tache.id}/modifier`}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Modifier
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Champ label="Type">{TYPE_TACHE_LABELS[tache.type]}</Champ>
          <Champ label="Priorité">{PRIORITE_TACHE_LABELS[tache.priorite]}</Champ>
          <Champ label="Échéance">
            {tache.dateEcheance ? formatDate(tache.dateEcheance) : "—"}
          </Champ>
          <Champ label="Assignée à">{tache.assigneeNom ?? "—"}</Champ>
          <Champ label="Créée le">{formatDate(tache.creeLe)}</Champ>
          {tache.faitLe && (
            <Champ label="Faite le">{formatDate(tache.faitLe)}</Champ>
          )}
          {tache.lienType && tache.lienId && (
            <div className="sm:col-span-2">
              <Champ label="Rattachée à">
                <Link
                  href={`${LIEN_TACHE_BASE[tache.lienType]}/${tache.lienId}`}
                  className="inline-flex items-center gap-1 text-blue-800 hover:underline dark:text-blue-300"
                >
                  {LIEN_TACHE_LABELS[tache.lienType]}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Champ>
            </div>
          )}
          {tache.description && (
            <div className="sm:col-span-2">
              <Champ label="Description">
                <span className="whitespace-pre-line">{tache.description}</span>
              </Champ>
            </div>
          )}
        </dl>
      </div>
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
