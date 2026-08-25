"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TYPES_BIEN, TYPE_BIEN_LABELS } from "@/types/bien";
import {
  OBJECTIFS_DEMANDE,
  OBJECTIF_DEMANDE_LABELS,
  STATUT_DEMANDE_LABELS,
  type StatutDemande,
} from "@/types/demande";
import type { ZoneOption } from "@/services/reference";
import { champClasse, labelClasse } from "./champsBien";

const STATUTS = Object.keys(STATUT_DEMANDE_LABELS) as StatutDemande[];

/**
 * Filtres de la liste des demandes : objectif, statut, zone, type. Composant
 * client qui ne fait que piloter l'URL (?objectif=&statut=&zone=&type=) ; la
 * page relit ces paramètres et recharge les données filtrées côté serveur. Toute
 * sélection remet la pagination à la page 1.
 */
export default function FiltresDemandes({ zones }: { zones: ZoneOption[] }) {
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label htmlFor="filtre-objectif" className={labelClasse}>
          Objectif
        </label>
        <select
          id="filtre-objectif"
          value={searchParams.get("objectif") ?? ""}
          onChange={(e) => appliquer("objectif", e.target.value)}
          className={champClasse}
        >
          <option value="">Tous les objectifs</option>
          {OBJECTIFS_DEMANDE.map((o) => (
            <option key={o} value={o}>
              {OBJECTIF_DEMANDE_LABELS[o]}
            </option>
          ))}
        </select>
      </div>

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
              {STATUT_DEMANDE_LABELS[s]}
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
    </div>
  );
}
