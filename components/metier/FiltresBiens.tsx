"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  TYPES_BIEN,
  TYPE_BIEN_LABELS,
  STATUT_BIEN_LABELS,
  type StatutBien,
} from "@/types/bien";
import type { ZoneOption } from "@/services/reference";
import { champClasse, labelClasse } from "./champsBien";

const STATUTS: StatutBien[] = Object.keys(STATUT_BIEN_LABELS) as StatutBien[];

/**
 * Filtres de la liste des biens : zone, type, cycle de vie. Composant client :
 * il ne fait que piloter l'URL (?zone=&type=&statut=). La page (Server
 * Component) relit ces paramètres et recharge les données filtrées côté serveur
 * — le filtrage reste donc en SQL, avec la RLS. Toute sélection remet la
 * pagination à la page 1.
 */
export default function FiltresBiens({ zones }: { zones: ZoneOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function appliquer(cle: string, valeur: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valeur) params.set(cle, valeur);
    else params.delete(cle);
    params.delete("page"); // un nouveau filtre repart de la 1re page
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <label htmlFor="filtre-zone" className={labelClasse}>
          Zone
        </label>
        <select
          id="filtre-zone"
          value={searchParams.get("zone") ?? ""}
          onChange={(e) => appliquer("zone", e.target.value)}
          className={champClasse}
        >
          <option value="">Toutes les zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.nom} ({z.villeNom})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filtre-type" className={labelClasse}>
          Type
        </label>
        <select
          id="filtre-type"
          value={searchParams.get("type") ?? ""}
          onChange={(e) => appliquer("type", e.target.value)}
          className={champClasse}
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
        <label htmlFor="filtre-statut" className={labelClasse}>
          Cycle de vie
        </label>
        <select
          id="filtre-statut"
          value={searchParams.get("statut") ?? ""}
          onChange={(e) => appliquer("statut", e.target.value)}
          className={champClasse}
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {STATUT_BIEN_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
