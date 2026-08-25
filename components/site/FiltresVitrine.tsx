"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TYPES_BIEN, TYPE_BIEN_LABELS } from "@/types/bien";
import type { ZoneVitrineOption } from "@/services/vitrine";

const selectClasse =
  "w-full rounded-lg border border-craie-200 bg-craie-50 px-3 py-2 text-sm text-slate-700 transition-colors focus:border-marine focus:outline-none focus:ring-1 focus:ring-marine";
const labelClasse = "mb-1 block text-xs font-medium text-slate-500";

/**
 * Filtres publics : objectif (vendre/louer), type de bien, ville. Comme dans
 * l'ERP, ce composant ne fait que piloter l'URL (?objectif=&type=&ville=) ; la
 * page (Server Component) relit ces paramètres et recharge les données filtrées
 * côté serveur. Toute sélection remet la pagination à la première page.
 */
export default function FiltresVitrine({
  zones,
}: {
  zones: ZoneVitrineOption[];
}) {
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
    <div className="grid grid-cols-1 gap-3 rounded-2xl bg-craie-100/60 p-4 ring-1 ring-craie-200 sm:grid-cols-3">
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
          <option value="">À vendre ou à louer</option>
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
        <label htmlFor="f-zone" className={labelClasse}>
          Zone
        </label>
        <select
          id="f-zone"
          value={searchParams.get("zone") ?? ""}
          onChange={(e) => appliquer("zone", e.target.value)}
          className={selectClasse}
        >
          <option value="">Toutes les zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.villeNom ? `${z.nom} · ${z.villeNom}` : z.nom}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
