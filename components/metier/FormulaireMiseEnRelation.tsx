"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { SensMiseEnRelation } from "@/types/mise-en-relation";
import {
  TYPE_PARTENAIRE_LABELS,
  type PartenaireOption,
} from "@/types/partenaire";
import type { BienOption } from "@/services/biens";
import { TYPE_BIEN_LABELS } from "@/types/bien";
import {
  creerMiseEnRelation,
  type MerState,
} from "@/services/mises-en-relation-actions";
import { champClasse, labelClasse } from "./champsBien";

const initialState: MerState = { error: null };

/**
 * Formulaire de mise en relation, deux modes selon `sens` :
 *  - sortante : lancée depuis une demande (demandeId fixé). Le produit du
 *    partenaire est décrit en texte (hors de notre portefeuille).
 *  - entrante : lancée depuis un bien, ou via un sélecteur. Le client vient du
 *    partenaire ; on note qui c'est en clair.
 */
export default function FormulaireMiseEnRelation({
  sens,
  partenaires,
  demandeId,
  bienId,
  biens = [],
}: {
  sens: SensMiseEnRelation;
  partenaires: PartenaireOption[];
  demandeId?: string;
  bienId?: string;
  biens?: BienOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    creerMiseEnRelation,
    initialState
  );

  const estEntrante = sens === "entrante";

  if (partenaires.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Aucun partenaire actif.{" "}
        <Link
          href="/partenaires/nouveau"
          className="text-blue-800 hover:underline dark:text-blue-300"
        >
          Enregistrez d&apos;abord un partenaire
        </Link>
        .
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="sens" value={sens} />
      {demandeId && <input type="hidden" name="demandeId" value={demandeId} />}

      {/* Partenaire : liste déroulante */}
      <div>
        <label htmlFor="partenaireId" className={labelClasse}>
          Partenaire
        </label>
        <select
          id="partenaireId"
          name="partenaireId"
          required
          defaultValue=""
          className={champClasse}
        >
          <option value="" disabled>
            Choisir un partenaire…
          </option>
          {partenaires.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom} · {TYPE_PARTENAIRE_LABELS[p.type]}
            </option>
          ))}
        </select>
      </div>

      {/* Bien concerné : sélecteur (entrante uniquement) */}
      {estEntrante && (
        <div>
          <label htmlFor="bienId" className={labelClasse}>
            Bien concerné
          </label>
          <select
            id="bienId"
            name="bienId"
            required
            defaultValue={bienId ?? ""}
            className={champClasse}
          >
            <option value="" disabled>
              Choisir un bien…
            </option>
            {biens.map((b) => (
              <option key={b.id} value={b.id}>
                {b.reference}
                {b.titre ? ` · ${b.titre}` : ` · ${TYPE_BIEN_LABELS[b.type]}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Note libre : produit du partenaire (sortante) / son client (entrante) */}
      <div>
        <label htmlFor="bienPropose" className={labelClasse}>
          {estEntrante
            ? "Client du partenaire (nom, besoin)"
            : "Produit proposé par le partenaire"}{" "}
          <span className="text-zinc-400">(optionnel)</span>
        </label>
        <textarea
          id="bienPropose"
          name="bienPropose"
          rows={2}
          placeholder={
            estEntrante
              ? "Ex. M. Diop, cherche à louer pour sa famille"
              : "Ex. Villa 4 chambres à Ngor, 250 M FCFA"
          }
          className={champClasse}
        />
      </div>

      {/* Commission (FCFA) : totale, part agence, part partenaire */}
      <fieldset className="space-y-3">
        <legend className={labelClasse}>Commission prévue (FCFA)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="commissionTotale"
              className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400"
            >
              Totale de l&apos;affaire
            </label>
            <input id="commissionTotale" name="commissionTotale" type="number" min="0" step="1" className={champClasse} />
          </div>
          <div>
            <label
              htmlFor="partAgence"
              className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400"
            >
              Part M2S
            </label>
            <input id="partAgence" name="partAgence" type="number" min="0" step="1" className={champClasse} />
          </div>
          <div>
            <label
              htmlFor="partPartenaire"
              className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400"
            >
              Part partenaire
            </label>
            <input id="partPartenaire" name="partPartenaire" type="number" min="0" step="1" className={champClasse} />
          </div>
        </div>
      </fieldset>

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
        {isPending ? "Enregistrement…" : "Créer la mise en relation"}
      </button>
    </form>
  );
}
