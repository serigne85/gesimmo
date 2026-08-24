"use client";

import { useActionState, useMemo, useState } from "react";
import {
  TYPES_BIEN,
  TYPE_BIEN_LABELS,
  type ObjectifBien,
  type BienEdition,
} from "@/types/bien";
import type { ZoneOption } from "@/services/reference";
import {
  creerBien,
  modifierBien,
  type CreerBienState,
} from "@/services/biens-actions";
import { champClasse, labelClasse } from "./champsBien";
import ChampsBienOptionnels from "./ChampsBienOptionnels";

const initialState: CreerBienState = { error: null };

/**
 * Formulaire de bien, deux modes : `bien` absent = création, `bien` présent =
 * édition (champs pré-remplis). En édition, le propriétaire n'est pas modifiable
 * ici (contact partagé, géré depuis le module Contacts).
 */
export default function FormulaireBien({
  zones,
  bien,
}: {
  zones: ZoneOption[];
  bien?: BienEdition;
}) {
  const isEdition = !!bien;
  const action = isEdition ? modifierBien.bind(null, bien.id) : creerBien;
  const [state, formAction, isPending] = useActionState(action, initialState);

  // Villes distinctes déduites des zones (pour la cascade ville → zone).
  const villes = useMemo(() => {
    const map = new Map<string, string>();
    zones.forEach((z) => map.set(z.villeId, z.villeNom));
    return Array.from(map, ([id, nom]) => ({ id, nom }));
  }, [zones]);

  const [villeId, setVilleId] = useState(bien?.villeId ?? villes[0]?.id ?? "");
  const [objectif, setObjectif] = useState<ObjectifBien>(bien?.objectif ?? "vente");

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
          <select
            id="zoneId"
            name="zoneId"
            required
            defaultValue={bien?.zoneId}
            className={champClasse}
          >
            {zonesFiltrees.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Propriétaire : saisi à la création seulement (contact partagé). */}
      {!isEdition && (
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
      )}

      {/* Détails optionnels repliés (sinon les agents cessent de saisir) */}
      <ChampsBienOptionnels bien={bien} defaultOpen={isEdition} />

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
        {isPending
          ? "Enregistrement…"
          : isEdition
            ? "Enregistrer les modifications"
            : "Enregistrer le bien"}
      </button>
    </form>
  );
}
