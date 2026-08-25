"use client";

import {
  TYPES_BIEN,
  TYPE_BIEN_LABELS,
  STATUTS_JURIDIQUES,
  STATUT_JURIDIQUE_LABELS,
  type BienEdition,
} from "@/types/bien";
import { champClasse, labelClasse } from "./champsBien";

/**
 * Caractéristiques du bien : type, surface, chambres, statut juridique, prix,
 * description. Champs non contrôlés (defaultValue) : c'est le formulaire qui
 * envoie, on ne suit pas chaque frappe. `bien` pré-remplit en mode édition.
 */
export default function ChampsCaracteristiques({ bien }: { bien?: BienEdition }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className={labelClasse}>
            Type de bien
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue={bien?.type ?? "appartement"}
            className={champClasse}
          >
            {TYPES_BIEN.map((t) => (
              <option key={t} value={t}>
                {TYPE_BIEN_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="surface" className={labelClasse}>
            Surface (m²)
          </label>
          <input
            id="surface"
            name="surface"
            type="number"
            min="1"
            step="1"
            defaultValue={bien?.surface ?? ""}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="nombreChambres" className={labelClasse}>
            Nombre de chambres
          </label>
          <input
            id="nombreChambres"
            name="nombreChambres"
            type="number"
            min="0"
            step="1"
            defaultValue={bien?.nombreChambres ?? ""}
            className={champClasse}
          />
        </div>
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
  );
}
