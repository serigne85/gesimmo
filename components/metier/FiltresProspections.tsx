"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  STATUT_PROSPECTION_LABELS,
  type StatutProspection,
} from "@/types/prospection";
import type { ZoneOption } from "@/services/reference";
import { champClasse, labelClasse } from "./champsBien";

const STATUTS = Object.keys(
  STATUT_PROSPECTION_LABELS
) as StatutProspection[];

/**
 * Filtres de la liste des prospections : statut, zone, et « relances dues »
 * (à relancer dont la date est passée). Composant client qui ne fait que
 * piloter l'URL ; la page relit les paramètres et recharge côté serveur. Toute
 * sélection remet la pagination à la page 1.
 */
export default function FiltresProspections({ zones }: { zones: ZoneOption[] }) {
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

  const relancesDues = searchParams.get("relances") === "1";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label htmlFor="filtre-statut" className={labelClasse}>
          Statut
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
              {STATUT_PROSPECTION_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

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

      <div className="flex items-end">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 has-[:checked]:border-amber-600 has-[:checked]:bg-amber-50 dark:border-zinc-700 dark:text-zinc-300 dark:has-[:checked]:bg-amber-950">
          <input
            type="checkbox"
            checked={relancesDues}
            onChange={(e) => appliquer("relances", e.target.checked ? "1" : "")}
            className="h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
          />
          Relances dues
        </label>
      </div>
    </div>
  );
}
