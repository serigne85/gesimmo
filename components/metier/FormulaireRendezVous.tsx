"use client";

import { useActionState, useState } from "react";
import {
  TYPES_RENDEZ_VOUS,
  TYPE_RENDEZ_VOUS_LABELS,
  STATUTS_RENDEZ_VOUS,
  STATUT_RENDEZ_VOUS_LABELS,
  type TypeRendezVous,
  type StatutRendezVous,
  type RendezVousDetail,
} from "@/types/rendez-vous";
import type { ContactOption } from "@/services/contacts";
import type { BienOption } from "@/services/biens";
import type { UtilisateurOption } from "@/services/utilisateurs";
import {
  creerRendezVous,
  modifierRendezVous,
  type RendezVousState,
} from "@/services/rendez-vous-actions";
import { champClasse, labelClasse } from "./champsBien";

const initialState: RendezVousState = { error: null };

function toLocalInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16) : "";
}

export type PrefillRendezVous = {
  type?: TypeRendezVous;
  titre?: string;
  contactId?: string;
  bienId?: string;
};

/**
 * Formulaire de rendez-vous, deux modes : `rendezVous` absent = création,
 * présent = édition (le statut devient réglable). La visite est un simple type.
 */
export default function FormulaireRendezVous({
  contacts,
  biens,
  utilisateurs,
  rendezVous,
  prefill,
}: {
  contacts: ContactOption[];
  biens: BienOption[];
  utilisateurs: UtilisateurOption[];
  rendezVous?: RendezVousDetail;
  prefill?: PrefillRendezVous;
}) {
  const isEdition = !!rendezVous;
  const action = isEdition
    ? modifierRendezVous.bind(null, rendezVous.id)
    : creerRendezVous;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [type, setType] = useState<TypeRendezVous>(
    rendezVous?.type ?? prefill?.type ?? "rendez_vous"
  );
  const [statut, setStatut] = useState<StatutRendezVous>(
    rendezVous?.statut ?? "planifie"
  );

  return (
    <form action={formAction} className="space-y-5">
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
          defaultValue={rendezVous?.titre ?? prefill?.titre ?? ""}
          className={champClasse}
        />
      </div>

      {/* Type : 5 options → boutons */}
      <div>
        <span className={labelClasse}>Type</span>
        <input type="hidden" name="type" value={type} />
        <div className="flex flex-wrap gap-2">
          {TYPES_RENDEZ_VOUS.map((val) => (
            <BoutonChoix
              key={val}
              actif={type === val}
              onClick={() => setType(val)}
              label={TYPE_RENDEZ_VOUS_LABELS[val]}
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
            {STATUTS_RENDEZ_VOUS.map((val) => (
              <BoutonChoix
                key={val}
                actif={statut === val}
                onClick={() => setStatut(val)}
                label={STATUT_RENDEZ_VOUS_LABELS[val]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="debut" className={labelClasse}>
            Début
          </label>
          <input
            id="debut"
            name="debut"
            type="datetime-local"
            required
            defaultValue={toLocalInput(rendezVous?.debut)}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="fin" className={labelClasse}>
            Fin <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="fin"
            name="fin"
            type="datetime-local"
            defaultValue={toLocalInput(rendezVous?.fin)}
            className={champClasse}
          />
        </div>
      </div>

      <div>
        <label htmlFor="lieu" className={labelClasse}>
          Lieu <span className="text-zinc-400">(optionnel)</span>
        </label>
        <input
          id="lieu"
          name="lieu"
          type="text"
          maxLength={300}
          defaultValue={rendezVous?.lieu ?? ""}
          className={champClasse}
        />
      </div>

      {/* Client, bien, assigné */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contactId" className={labelClasse}>
            Client <span className="text-zinc-400">(optionnel)</span>
          </label>
          <select
            id="contactId"
            name="contactId"
            defaultValue={rendezVous?.contactId ?? prefill?.contactId ?? ""}
            className={champClasse}
          >
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomComplet} · {c.telephone}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bienId" className={labelClasse}>
            Bien <span className="text-zinc-400">(optionnel)</span>
          </label>
          <select
            id="bienId"
            name="bienId"
            defaultValue={rendezVous?.bienId ?? prefill?.bienId ?? ""}
            className={champClasse}
          >
            <option value="">—</option>
            {biens.map((b) => (
              <option key={b.id} value={b.id}>
                {b.reference}
                {b.titre ? ` · ${b.titre}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="assigneeId" className={labelClasse}>
          Assigné à
        </label>
        <select
          id="assigneeId"
          name="assigneeId"
          defaultValue={rendezVous?.assigneeId ?? ""}
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

      <div>
        <label htmlFor="notes" className={labelClasse}>
          Notes <span className="text-zinc-400">(optionnel)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={rendezVous?.notes ?? ""}
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
            : "Créer le rendez-vous"}
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
