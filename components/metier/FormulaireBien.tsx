"use client";

import { useActionState, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  TYPES_BIEN,
  TYPE_BIEN_LABELS,
  STATUTS_JURIDIQUES,
  STATUT_JURIDIQUE_LABELS,
  type ObjectifBien,
} from "@/types/bien";
import type { ZoneOption } from "@/services/reference";
import { creerBien, type CreerBienState } from "@/services/biens-actions";

const initialState: CreerBienState = { error: null };

const champClasse =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
const labelClasse =
  "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function FormulaireBien({ zones }: { zones: ZoneOption[] }) {
  const [state, formAction, isPending] = useActionState(creerBien, initialState);

  // Villes distinctes déduites des zones (pour la cascade ville → zone).
  const villes = useMemo(() => {
    const map = new Map<string, string>();
    zones.forEach((z) => map.set(z.villeId, z.villeNom));
    return Array.from(map, ([id, nom]) => ({ id, nom }));
  }, [zones]);

  const [villeId, setVilleId] = useState(villes[0]?.id ?? "");
  const [objectif, setObjectif] = useState<ObjectifBien>("vente");
  const [showMore, setShowMore] = useState(false);

  const zonesFiltrees = zones.filter((z) => z.villeId === villeId);

  return (
    <form action={formAction} className="space-y-5">
      {/* Objectif : 2 options → boutons (CLAUDE.md) */}
      <div>
        <span className={labelClasse}>Objectif</span>
        <input type="hidden" name="objectif" value={objectif} />
        <div className="flex gap-2">
          {(["vente", "location"] as ObjectifBien[]).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setObjectif(val)}
              className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                objectif === val
                  ? "border-blue-700 bg-blue-900 text-white"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              {val === "vente" ? "Vente" : "Location"}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className={labelClasse}>
          Type de bien
        </label>
        <select id="type" name="type" required defaultValue="appartement" className={champClasse}>
          {TYPES_BIEN.map((t) => (
            <option key={t} value={t}>
              {TYPE_BIEN_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Ville + zone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ville" className={labelClasse}>
            Ville
          </label>
          <select
            id="ville"
            value={villeId}
            onChange={(e) => setVilleId(e.target.value)}
            className={champClasse}
          >
            {villes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="zoneId" className={labelClasse}>
            Zone
          </label>
          <select id="zoneId" name="zoneId" required className={champClasse}>
            {zonesFiltrees.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Propriétaire */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="proprietaireNom" className={labelClasse}>
            Nom du propriétaire
          </label>
          <input id="proprietaireNom" name="proprietaireNom" type="text" required className={champClasse} />
        </div>
        <div>
          <label htmlFor="proprietaireTelephone" className={labelClasse}>
            Téléphone du propriétaire
          </label>
          <input
            id="proprietaireTelephone"
            name="proprietaireTelephone"
            type="tel"
            required
            placeholder="77 123 45 67"
            className={champClasse}
          />
        </div>
      </div>

      {/* Détails optionnels repliés (sinon les agents cessent de saisir) */}
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
                <select id="statutJuridique" name="statutJuridique" defaultValue="" className={champClasse}>
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
                <input id="prix" name="prix" type="number" min="0" step="1" className={champClasse} />
              </div>
            </div>
            <div>
              <label htmlFor="description" className={labelClasse}>
                Description
              </label>
              <textarea id="description" name="description" rows={3} className={champClasse} />
            </div>
          </div>
        )}
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Enregistrement…" : "Enregistrer le bien"}
      </button>
    </form>
  );
}
