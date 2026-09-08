import Link from "next/link";
import { listMisesEnRelation, MER_PAGE_SIZE } from "@/services/mises-en-relation";
import {
  STATUT_MISE_EN_RELATION_LABELS,
  type StatutMiseEnRelation,
} from "@/types/mise-en-relation";
import TableauMisesEnRelation from "@/components/metier/TableauMisesEnRelation";

/**
 * Suivi de toutes les mises en relation de l'agence. Server Component (RLS
 * active). Filtre par statut et pagination via l'URL (appliqués en base). La
 * création se fait depuis une demande (bouton « Soumettre à un partenaire »).
 */
export default async function MisesEnRelationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; statut?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const statut =
    sp.statut && sp.statut in STATUT_MISE_EN_RELATION_LABELS
      ? (sp.statut as StatutMiseEnRelation)
      : undefined;

  const { rows, total } = await listMisesEnRelation(page, { statut });
  const nbPages = Math.max(1, Math.ceil(total / MER_PAGE_SIZE));

  const paramsBase = new URLSearchParams();
  if (statut) paramsBase.set("statut", statut);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Mises en relation
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {total} affaire{total > 1 ? "s" : ""} d&apos;apport avec des partenaires
        </p>
      </div>

      {/* Filtre par statut */}
      <div className="flex flex-wrap gap-2 text-sm">
        <FiltreLien label="Toutes" actif={!statut} href="/mises-en-relation" />
        {(Object.keys(STATUT_MISE_EN_RELATION_LABELS) as StatutMiseEnRelation[]).map(
          (s) => (
            <FiltreLien
              key={s}
              label={STATUT_MISE_EN_RELATION_LABELS[s]}
              actif={statut === s}
              href={`/mises-en-relation?statut=${s}`}
            />
          )
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucune mise en relation. Depuis une demande sans bien disponible,
          utilisez « Soumettre à un partenaire ».
        </div>
      ) : (
        <TableauMisesEnRelation misesEnRelation={rows} />
      )}

      {nbPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <PaginationLien
            page={page - 1}
            disabled={page <= 1}
            label="Précédent"
            paramsBase={paramsBase}
          />
          <span className="text-zinc-500 dark:text-zinc-400">
            Page {page} / {nbPages}
          </span>
          <PaginationLien
            page={page + 1}
            disabled={page >= nbPages}
            label="Suivant"
            paramsBase={paramsBase}
          />
        </div>
      )}
    </div>
  );
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
      href={`/mises-en-relation?${params.toString()}`}
      className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {label}
    </Link>
  );
}
