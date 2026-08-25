"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TYPES_BIEN, TYPE_BIEN_LABELS } from "@/types/bien";
import type { VilleOption } from "@/services/vitrine";

const selectClasse =
  "w-full rounded-lg border border-sable-200 bg-sable-50 px-3 py-2 text-sm text-stone-700 transition-colors focus:border-bleu-profond focus:outline-none focus:ring-1 focus:ring-bleu-profond";
const labelClasse = "mb-1 block text-xs font-medium text-stone-500";

/**
 * Filtres publics : objectif (vendre/louer), type de bien, ville. Comme dans
 * l'ERP, ce composant ne fait que piloter l'URL (?objectif=&type=&ville=) ; la
 * page (Server Component) relit ces paramètres et recharge les données filtrées
 * côté serveur. Toute sélection remet la pagination à la première page.
 */
export default function FiltresVitrine({ villes }: { villes: VilleOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function appliquer(cle: string, valeur: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valeur) params.set(cle, valeur);
    else params.delete(cle);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl bg-sable-100/60 p-4 ring-1 ring-sable-200 sm:grid-cols-3">
      <div>
        <label htmlFor="f-objectif" className={labelClasse}>
          Objectif
        </label>
        <select
          id="f-objectif"
          value={searchParams.get("objectif") ?? ""}
          onChange={(e) => appliquer("objectif", e.target.value)}
          className={selectClasse}
        >
          <option value="">Vendre ou louer</option>
          <option value="vente">À vendre</option>
          <option value="location">À louer</option>
        </select>
      </div>

      <div>
        <label htmlFor="f-type" className={labelClasse}>
          Type de bien
        </label>
        <select
          id="f-type"
          value={searchParams.get("type") ?? ""}
          onChange={(e) => appliquer("type", e.target.value)}
          className={selectClasse}
        >
          <option value="">Tous les types</option>
          {TYPES_BIEN.map((t) => (
            <option key={t} value={t}>
              {TYPE_BIEN_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="f-ville" className={labelClasse}>
          Ville
        </label>
        <select
          id="f-ville"
          value={searchParams.get("ville") ?? ""}
          onChange={(e) => appliquer("ville", e.target.value)}
          className={selectClasse}
        >
          <option value="">Toutes les villes</option>
          {villes.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nom}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
