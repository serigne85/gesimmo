import Link from "next/link";
import { Plus } from "lucide-react";
import { listBiens, BIENS_PAGE_SIZE } from "@/services/biens";
import LigneBien from "@/components/metier/LigneBien";

/**
 * Liste des biens de l'agence. Server Component : les données sont chargées
 * côté serveur (RLS active), la liste est rendue en lignes bordées.
 * La pagination passe par le paramètre d'URL ?page=.
 */
export default async function BiensPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { rows, total } = await listBiens(page);
  const nbPages = Math.max(1, Math.ceil(total / BIENS_PAGE_SIZE));

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

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucun bien pour l'instant. Commencez par en saisir un.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {rows.map((bien) => (
            <LigneBien key={bien.id} bien={bien} />
          ))}
        </ul>
      )}

      {/* Pagination */}
      {nbPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <PaginationLien page={page - 1} disabled={page <= 1} label="Précédent" />
          <span className="text-zinc-500 dark:text-zinc-400">
            Page {page} / {nbPages}
          </span>
          <PaginationLien page={page + 1} disabled={page >= nbPages} label="Suivant" />
        </div>
      )}
    </div>
  );
}

function PaginationLien({
  page,
  disabled,
  label,
}: {
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return <span className="text-zinc-300 dark:text-zinc-700">{label}</span>;
  }
  return (
    <Link
      href={`/biens?page=${page}`}
      className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {label}
    </Link>
  );
}
