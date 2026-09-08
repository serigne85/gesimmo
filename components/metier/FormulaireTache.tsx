"use client";

import { useActionState, useState } from "react";
import {
  TYPES_TACHE,
  TYPE_TACHE_LABELS,
  PRIORITES_TACHE,
  PRIORITE_TACHE_LABELS,
  STATUTS_TACHE,
  STATUT_TACHE_LABELS,
  LIEN_TACHE_LABELS,
  type TypeTache,
  type PrioriteTache,
  type StatutTache,
  type LienTache,
  type TacheDetail,
} from "@/types/tache";
import type { UtilisateurOption } from "@/services/utilisateurs";
import {
  creerTache,
  modifierTache,
  type TacheState,
} from "@/services/taches-actions";
import { champClasse, labelClasse } from "./champsBien";

const initialState: TacheState = { error: null };

/** ISO → valeur d'un input datetime-local (Africa/Dakar = UTC+0). */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

/** Préremplissage à la création depuis une fiche métier. */
export type PrefillTache = {
  titre?: string;
  lienType?: LienTache;
  lienId?: string;
};

/**
 * Formulaire de tâche, deux modes : `tache` absent = création, présent =
 * édition (le statut devient réglable). Le rattachement (lien) n'est pas saisi
 * à la main : il vient d'un préremplissage quand on crée depuis une fiche.
 */
export default function FormulaireTache({
  utilisateurs,
  tache,
  prefill,
}: {
  utilisateurs: UtilisateurOption[];
  tache?: TacheDetail;
  prefill?: PrefillTache;
}) {
  const isEdition = !!tache;
  const action = isEdition ? modifierTache.bind(null, tache.id) : creerTache;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [type, setType] = useState<TypeTache>(tache?.type ?? "autre");
  const [priorite, setPriorite] = useState<PrioriteTache>(
    tache?.priorite ?? "normale"
  );
  const [statut, setStatut] = useState<StatutTache>(tache?.statut ?? "a_faire");

  const lienType = tache?.lienType ?? prefill?.lienType ?? null;
  const lienId = tache?.lienId ?? prefill?.lienId ?? null;

  return (
    <form action={formAction} className="space-y-5">
      {/* Rattachement (non modifiable, informatif) */}
      {lienType && lienId && (
        <>
          <input type="hidden" name="lienType" value={lienType} />
          <input type="hidden" name="lienId" value={lienId} />
          <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            Rattachée à : {LIEN_TACHE_LABELS[lienType]}
          </p>
        </>
      )}

      <div>
        <label htmlFor="titre" className={labelClasse}>
          Titre
        </label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          maxLength={200}
          defaultValue={tache?.titre ?? prefill?.titre ?? ""}
          className={champClasse}
        />
      </div>

      {/* Type : 4 options → boutons */}
      <div>
        <span className={labelClasse}>Type</span>
        <input type="hidden" name="type" value={type} />
        <div className="flex flex-wrap gap-2">
          {TYPES_TACHE.map((val) => (
            <BoutonChoix
              key={val}
              actif={type === val}
              onClick={() => setType(val)}
              label={TYPE_TACHE_LABELS[val]}
            />
          ))}
        </div>
      </div>

      {/* Priorité : 3 options → boutons */}
      <div>
        <span className={labelClasse}>Priorité</span>
        <input type="hidden" name="priorite" value={priorite} />
        <div className="flex gap-2">
          {PRIORITES_TACHE.map((val) => (
            <BoutonChoix
              key={val}
              actif={priorite === val}
              onClick={() => setPriorite(val)}
              label={PRIORITE_TACHE_LABELS[val]}
            />
          ))}
        </div>
      </div>

      {/* Statut : édition seulement */}
      {isEdition && (
        <div>
          <span className={labelClasse}>Statut</span>
          <input type="hidden" name="statut" value={statut} />
          <div className="flex flex-wrap gap-2">
            {STATUTS_TACHE.map((val) => (
              <BoutonChoix
                key={val}
                actif={statut === val}
                onClick={() => setStatut(val)}
                label={STATUT_TACHE_LABELS[val]}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dateEcheance" className={labelClasse}>
            Échéance <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="dateEcheance"
            name="dateEcheance"
            type="datetime-local"
            defaultValue={toLocalInput(tache?.dateEcheance)}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="assigneeId" className={labelClasse}>
            Assignée à
          </label>
          <select
            id="assigneeId"
            name="assigneeId"
            defaultValue={tache?.assigneeId ?? ""}
            className={champClasse}
          >
            <option value="">Moi (par défaut)</option>
            {utilisateurs.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nomComplet}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClasse}>
          Description <span className="text-zinc-400">(optionnel)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={tache?.description ?? ""}
          className={champClasse}
        />
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
        {isPending
          ? "Enregistrement…"
          : isEdition
            ? "Enregistrer les modifications"
            : "Créer la tâche"}
      </button>
    </form>
  );
}

function BoutonChoix({
  actif,
  onClick,
  label,
}: {
  actif: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
        actif
          ? "border-blue-700 bg-blue-900 text-white"
          : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      }`}
    >
      {label}
    </button>
  );
}
