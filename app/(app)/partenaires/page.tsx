import Link from "next/link";
import { Plus } from "lucide-react";
import { listPartenaires, PARTENAIRES_PAGE_SIZE } from "@/services/partenaires";
import { getUtilisateurConnecte } from "@/services/auth";
import {
  TYPE_PARTENAIRE_LABELS,
  type TypePartenaire,
} from "@/types/partenaire";
import TableauPartenaires from "@/components/metier/TableauPartenaires";

/**
 * Liste des partenaires (agences confrères, courtiers). Server Component :
 * données chargées côté serveur (RLS active), présentées en lignes bordées.
 * Filtre par type et pagination via l'URL, donc appliqués en base.
 */
export default async function PartenairesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const type =
    sp.type && sp.type in TYPE_PARTENAIRE_LABELS
      ? (sp.type as TypePartenaire)
      : undefined;

  const [{ rows, total }, profil] = await Promise.all([
    listPartenaires(page, { type }),
    getUtilisateurConnecte(),
  ]);
  const nbPages = Math.max(1, Math.ceil(total / PARTENAIRES_PAGE_SIZE));
  const estAdmin = profil?.role === "admin";

  const paramsBase = new URLSearchParams();
  if (type) paramsBase.set("type", type);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Partenaires
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {total} partenaire{total > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/partenaires/nouveau"
          className="flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau partenaire
        </Link>
      </div>

      {/* Filtre par type : peu d'options → liens simples */}
      <div className="flex flex-wrap gap-2 text-sm">
        <FiltreLien label="Tous" actif={!type} href="/partenaires" />
        {(Object.keys(TYPE_PARTENAIRE_LABELS) as TypePartenaire[]).map((t) => (
          <FiltreLien
            key={t}
            label={TYPE_PARTENAIRE_LABELS[t]}
            actif={type === t}
            href={`/partenaires?type=${t}`}
          />
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucun partenaire. Enregistrez une agence confrère ou un courtier.
        </div>
      ) : (
        <TableauPartenaires partenaires={rows} peutSupprimer={estAdmin} />
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
      href={`/partenaires?${params.toString()}`}
      className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {label}
    </Link>
  );
}
