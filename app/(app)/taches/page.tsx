import Link from "next/link";
import { Plus } from "lucide-react";
import { listTaches, TACHES_PAGE_SIZE } from "@/services/taches";
import {
  STATUT_TACHE_LABELS,
  TYPE_TACHE_LABELS,
  type StatutTache,
  type TypeTache,
} from "@/types/tache";
import TableauTaches from "@/components/metier/TableauTaches";

/**
 * Liste des tâches (le point unique des actions à mener). Server Component :
 * données chargées côté serveur (RLS active). Filtres statut/type et pagination
 * via l'URL, donc appliqués en base.
 */
export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; statut?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const statut =
    sp.statut && sp.statut in STATUT_TACHE_LABELS
      ? (sp.statut as StatutTache)
      : undefined;
  const type =
    sp.type && sp.type in TYPE_TACHE_LABELS
      ? (sp.type as TypeTache)
      : undefined;

  const { rows, total } = await listTaches(page, { statut, type });
  const nbPages = Math.max(1, Math.ceil(total / TACHES_PAGE_SIZE));
  const aujourdhui = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Dakar",
  });

  const paramsBase = new URLSearchParams();
  if (statut) paramsBase.set("statut", statut);
  if (type) paramsBase.set("type", type);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Tâches
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {total} tâche{total > 1 ? "s" : ""} · relances et actions à mener
          </p>
        </div>
        <Link
          href="/taches/nouveau"
          className="flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvelle tâche
        </Link>
      </div>

      {/* Filtre par statut */}
      <div className="flex flex-wrap gap-2 text-sm">
        <FiltreLien label="Toutes" actif={!statut} href={hrefAvec({ type }, {})} />
        {(Object.keys(STATUT_TACHE_LABELS) as StatutTache[]).map((s) => (
          <FiltreLien
            key={s}
            label={STATUT_TACHE_LABELS[s]}
            actif={statut === s}
            href={hrefAvec({ type }, { statut: s })}
          />
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucune tâche ne correspond. Modifiez les filtres ou créez-en une.
        </div>
      ) : (
        <TableauTaches taches={rows} aujourdhui={aujourdhui} />
      )}

      {nbPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <PaginationLien page={page - 1} disabled={page <= 1} label="Précédent" paramsBase={paramsBase} />
          <span className="text-zinc-500 dark:text-zinc-400">
            Page {page} / {nbPages}
          </span>
          <PaginationLien page={page + 1} disabled={page >= nbPages} label="Suivant" paramsBase={paramsBase} />
        </div>
      )}
    </div>
  );
}

/** Construit un href /taches en conservant certains filtres. */
function hrefAvec(
  garder: { type?: string },
  ajout: { statut?: string }
): string {
  const p = new URLSearchParams();
  if (garder.type) p.set("type", garder.type);
  if (ajout.statut) p.set("statut", ajout.statut);
  const qs = p.toString();
  return qs ? `/taches?${qs}` : "/taches";
}

function FiltreLien({
  label,
  actif,
  href,
}: {
  label: string;
  actif: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md border px-3 py-1.5 font-medium transition-colors ${
        actif
          ? "border-blue-700 bg-blue-900 text-white"
          : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      }`}
    >
      {label}
    </Link>
  );
}

function PaginationLien({
  page,
  disabled,
  label,
  paramsBase,
}: {
  page: number;
  disabled: boolean;
  label: string;
  paramsBase: URLSearchParams;
}) {
  if (disabled) {
    return <span className="text-zinc-300 dark:text-zinc-700">{label}</span>;
  }
  const params = new URLSearchParams(paramsBase);
  params.set("page", String(page));
  return (
    <Link
      href={`/taches?${params.toString()}`}
      className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {label}
    </Link>
  );
}
