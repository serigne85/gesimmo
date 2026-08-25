import Link from "next/link";
import { Plus } from "lucide-react";
import { listBiens, BIENS_PAGE_SIZE } from "@/services/biens";
import { listZones } from "@/services/reference";
import { TYPES_BIEN, STATUT_BIEN_LABELS } from "@/types/bien";
import type { TypeBien, StatutBien } from "@/types/bien";
import FiltresBiens from "@/components/metier/FiltresBiens";
import TableauBiens from "@/components/metier/TableauBiens";

/**
 * Liste des biens de l'agence. Server Component : les données sont chargées
 * côté serveur (RLS active), présentées en tableau. Les filtres (zone, type,
 * cycle de vie) et la pagination passent par des paramètres d'URL, si bien que
 * le filtrage est fait en SQL, pas dans le navigateur.
 */
export default async function BiensPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    zone?: string;
    type?: string;
    statut?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  // On ne retient que des valeurs connues (défense côté serveur).
  const zoneId = sp.zone || undefined;
  const type = TYPES_BIEN.includes(sp.type as TypeBien)
    ? (sp.type as TypeBien)
    : undefined;
  const statut = sp.statut && sp.statut in STATUT_BIEN_LABELS
    ? (sp.statut as StatutBien)
    : undefined;

  const [zones, { rows, total }] = await Promise.all([
    listZones(),
    listBiens(page, { zoneId, type, statut }),
  ]);
  const nbPages = Math.max(1, Math.ceil(total / BIENS_PAGE_SIZE));

  // Chaîne de paramètres pour conserver les filtres dans les liens de pagination.
  const paramsBase = new URLSearchParams();
  if (zoneId) paramsBase.set("zone", zoneId);
  if (type) paramsBase.set("type", type);
  if (statut) paramsBase.set("statut", statut);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Biens
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {total} bien{total > 1 ? "s" : ""} au portefeuille
          </p>
        </div>
        <Link
          href="/biens/nouveau"
          className="flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau bien
        </Link>
      </div>

      <FiltresBiens zones={zones} />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucun bien ne correspond. Modifiez les filtres ou saisissez-en un.
        </div>
      ) : (
        <TableauBiens biens={rows} />
      )}

      {/* Pagination */}
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
      href={`/biens?${params.toString()}`}
      className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {label}
    </Link>
  );
}
