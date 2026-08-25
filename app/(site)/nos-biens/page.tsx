import Link from "next/link";
import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import {
  listBiensVitrine,
  listVillesVitrine,
  estUuid,
  VITRINE_PAGE_SIZE,
} from "@/services/vitrine";
import { TYPES_BIEN, OBJECTIF_LABELS } from "@/types/bien";
import type { TypeBien, ObjectifBien } from "@/types/bien";
import FiltresVitrine from "@/components/site/FiltresVitrine";
import CarteBienVitrine from "@/components/site/CarteBienVitrine";

export const metadata: Metadata = {
  title: "Nos biens disponibles",
  description:
    "Découvrez tous les biens disponibles à la vente et à la location chez M2S IMMO, à Dakar.",
};

/**
 * Liste publique des biens disponibles. Server Component : les données sont
 * chargées côté serveur via le service vitrine (lecture cloisonnée aux biens
 * `disponible`, sans aucune donnée propriétaire). Filtres et pagination passent
 * par l'URL — le filtrage reste donc en SQL, pas dans le navigateur.
 */
export default async function NosBiensPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    objectif?: string;
    type?: string;
    ville?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  // Défense côté serveur : on ne retient que des valeurs connues.
  const objectif =
    sp.objectif && sp.objectif in OBJECTIF_LABELS
      ? (sp.objectif as ObjectifBien)
      : undefined;
  const type = TYPES_BIEN.includes(sp.type as TypeBien)
    ? (sp.type as TypeBien)
    : undefined;
  // On n'accepte qu'un identifiant au format UUID : une valeur trafiquée dans
  // l'URL (?ville=zzz) provoquerait sinon une erreur SQL (uuid invalide).
  const villeId = sp.ville && estUuid(sp.ville) ? sp.ville : undefined;

  const [{ rows, total }, villes] = await Promise.all([
    listBiensVitrine(page, { objectif, type, villeId }),
    listVillesVitrine(),
  ]);
  const nbPages = Math.max(1, Math.ceil(total / VITRINE_PAGE_SIZE));

  // Conserve les filtres actifs dans les liens de pagination.
  const paramsBase = new URLSearchParams();
  if (objectif) paramsBase.set("objectif", objectif);
  if (type) paramsBase.set("type", type);
  if (villeId) paramsBase.set("ville", villeId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
          Nos biens disponibles
        </h1>
        <p className="mt-2 text-slate-600">
          {total} bien{total > 1 ? "s" : ""} à découvrir à Dakar.
        </p>
      </header>

      <FiltresVitrine villes={villes} />

      {rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-craie-200 bg-craie-100/50 p-14 text-center">
          <SearchX className="h-10 w-10 text-slate-400" aria-hidden="true" />
          <p className="mt-4 font-medium text-slate-700">
            Aucun bien ne correspond à votre recherche
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Modifiez vos filtres ou revenez bientôt : notre portefeuille évolue
            chaque semaine.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((bien) => (
            <li key={bien.id}>
              <CarteBienVitrine bien={bien} />
            </li>
          ))}
        </ul>
      )}

      {nbPages > 1 && (
        <nav className="mt-12 flex items-center justify-between text-sm">
          <PaginationLien
            page={page - 1}
            disabled={page <= 1}
            label="Précédent"
            paramsBase={paramsBase}
          />
          <span className="text-slate-500">
            Page {page} / {nbPages}
          </span>
          <PaginationLien
            page={page + 1}
            disabled={page >= nbPages}
            label="Suivant"
            paramsBase={paramsBase}
          />
        </nav>
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
    return <span className="text-slate-300">{label}</span>;
  }
  const params = new URLSearchParams(paramsBase);
  params.set("page", String(page));
  return (
    <Link
      href={`/nos-biens?${params.toString()}`}
      className="rounded-full border border-craie-200 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-craie-100"
    >
      {label}
    </Link>
  );
}
