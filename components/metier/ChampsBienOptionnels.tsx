"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  STATUTS_JURIDIQUES,
  STATUT_JURIDIQUE_LABELS,
  type BienEdition,
} from "@/types/bien";
import { champClasse, labelClasse } from "./champsBien";

/**
 * Détails complémentaires d'un bien (repliés par défaut à la création pour ne
 * pas alourdir la saisie rapide, ouverts à l'édition pour montrer l'existant).
 * `bien` fournit les valeurs à pré-remplir en mode édition.
 */
export default function ChampsBienOptionnels({
  bien,
  defaultOpen,
}: {
  bien?: BienEdition;
  defaultOpen: boolean;
}) {
  const [showMore, setShowMore] = useState(defaultOpen);

  return (
    <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="flex items-center gap-1 text-sm font-medium text-blue-800 dark:text-blue-300"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${showMore ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
        Détails complémentaires (optionnel)
      </button>

      {showMore && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="statutJuridique" className={labelClasse}>
                Statut juridique
              </label>
              <select
                id="statutJuridique"
                name="statutJuridique"
                defaultValue={bien?.statutJuridique ?? ""}
                className={champClasse}
              >
                <option value="">Non renseigné</option>
                {STATUTS_JURIDIQUES.map((s) => (
                  <option key={s} value={s}>
                    {STATUT_JURIDIQUE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prix" className={labelClasse}>
                Prix (FCFA)
              </label>
              <input
                id="prix"
                name="prix"
                type="number"
                min="0"
                step="1"
                defaultValue={bien?.prix ?? ""}
                className={champClasse}
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className={labelClasse}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={bien?.description ?? ""}
              className={champClasse}
            />
          </div>
        </div>
      )}
    </div>
  );
}
