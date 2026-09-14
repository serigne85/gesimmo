"use client";

import { useActionState } from "react";
import {
  changerEtapeOpportunite,
  type OpportuniteActionState,
} from "@/services/opportunites-actions";
import type { EtapePipeline } from "@/types/opportunite";
import { champClasse, labelClasse } from "./champsBien";

const initialState: OpportuniteActionState = { error: null };

/**
 * Sélecteur de changement d'étape d'une opportunité. Le statut (ouverte/gagnée/
 * perdue) est recalculé côté serveur depuis le type de l'étape choisie. Un
 * commentaire optionnel est joint au journal ; pour une étape « perte » il sert
 * de motif. L'action est liée à l'id de l'opportunité via .bind.
 */
export default function ChangerEtapeOpportunite({
  opportuniteId,
  etapeCouranteId,
  etapes,
}: {
  opportuniteId: string;
  etapeCouranteId: string;
  etapes: EtapePipeline[];
}) {
  const action = changerEtapeOpportunite.bind(null, opportuniteId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="etapeId" className={labelClasse}>
          Étape
        </label>
        <select
          id="etapeId"
          name="etapeId"
          defaultValue={etapeCouranteId}
          className={champClasse}
        >
          {etapes.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nom}
              {e.type === "gain" ? " (gagné)" : e.type === "perte" ? " (perdu)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="commentaire" className={labelClasse}>
          Commentaire <span className="text-zinc-400">(optionnel, motif si perdu)</span>
        </label>
        <input
          id="commentaire"
          name="commentaire"
          type="text"
          placeholder="Ex. offre acceptée / prix trop élevé"
          className={champClasse}
        />
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Déplacer l'opportunité"}
      </button>
    </form>
  );
}
