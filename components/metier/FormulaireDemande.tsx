"use client";

import { useActionState, useMemo, useState } from "react";
import {
  TYPES_BIEN,
  TYPE_BIEN_LABELS,
  type TypeBien,
} from "@/types/bien";
import {
  OBJECTIFS_DEMANDE,
  OBJECTIF_DEMANDE_LABELS,
  STATUT_DEMANDE_LABELS,
  type ObjectifDemande,
  type StatutDemande,
  type DemandeEdition,
} from "@/types/demande";
import type { ZoneOption } from "@/services/reference";
import {
  creerDemande,
  modifierDemande,
  type CreerDemandeState,
} from "@/services/demandes-actions";
import { champClasse, labelClasse } from "./champsBien";

const initialState: CreerDemandeState = { error: null };
const STATUTS = Object.keys(STATUT_DEMANDE_LABELS) as StatutDemande[];

/**
 * Formulaire de demande client, deux modes : `demande` absent = création,
 * présent = édition. En édition, le client (contact partagé) n'est pas modifié
 * ici, et le statut devient réglable. Zones et types sont multiples.
 */
export default function FormulaireDemande({
  zones,
  aujourdhui,
  demande,
}: {
  zones: ZoneOption[];
  aujourdhui: string;
  demande?: DemandeEdition;
}) {
  const isEdition = !!demande;
  const action = isEdition
    ? modifierDemande.bind(null, demande.id)
    : creerDemande;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [objectif, setObjectif] = useState<ObjectifDemande>(
    demande?.objectif ?? "achat"
  );
  const [statut, setStatut] = useState<StatutDemande>(
    demande?.statut ?? "active"
  );

  // Zones groupées par ville, pour une liste lisible.
  const zonesParVille = useMemo(() => {
    const groupes = new Map<string, ZoneOption[]>();
    zones.forEach((z) => {
      const liste = groupes.get(z.villeNom) ?? [];
      liste.push(z);
      groupes.set(z.villeNom, liste);
    });
    return Array.from(groupes, ([ville, liste]) => ({ ville, liste }));
  }, [zones]);

  return (
    <form action={formAction} className="space-y-5">
      {/* Client : saisi à la création, affiché seul en édition */}
      {isEdition ? (
        <div>
          <span className={labelClasse}>Client</span>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {demande.clientNom}{" "}
            <span className="text-zinc-400">· {demande.clientTelephone}</span>
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="clientNom" className={labelClasse}>
              Nom du client
            </label>
            <input
              id="clientNom"
              name="clientNom"
              type="text"
              required
              maxLength={150}
              className={champClasse}
            />
          </div>
          <div>
            <label htmlFor="clientTelephone" className={labelClasse}>
              Téléphone
            </label>
            <input
              id="clientTelephone"
              name="clientTelephone"
              type="tel"
              required
              maxLength={30}
              className={champClasse}
            />
          </div>
        </div>
      )}

      {/* Objectif : 2 options → boutons (CLAUDE.md) */}
      <div>
        <span className={labelClasse}>Objectif</span>
        <input type="hidden" name="objectif" value={objectif} />
        <div className="flex gap-2">
          {OBJECTIFS_DEMANDE.map((val) => (
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
              {OBJECTIF_DEMANDE_LABELS[val]}
            </button>
          ))}
        </div>
      </div>

      {/* Statut : édition seulement (3 options → boutons) */}
      {isEdition && (
        <div>
          <span className={labelClasse}>Statut</span>
          <input type="hidden" name="statut" value={statut} />
          <div className="flex gap-2">
            {STATUTS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setStatut(val)}
                className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  statut === val
                    ? "border-blue-700 bg-blue-900 text-white"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                {STATUT_DEMANDE_LABELS[val]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dates : demande (pré-remplie) et échéance (pour la priorité) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dateDemande" className={labelClasse}>
            Date de la demande
          </label>
          <input
            id="dateDemande"
            name="dateDemande"
            type="date"
            defaultValue={demande?.dateDemande ?? aujourdhui}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="dateEcheance" className={labelClasse}>
            Échéance <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="dateEcheance"
            name="dateEcheance"
            type="date"
            defaultValue={demande?.dateEcheance ?? ""}
            className={champClasse}
          />
        </div>
      </div>

      {/* Types recherchés (plusieurs) */}
      <div>
        <span className={labelClasse}>Types recherchés</span>
        <div className="flex flex-wrap gap-2">
          {TYPES_BIEN.map((t: TypeBien) => (
            <label
              key={t}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1 text-sm text-zinc-700 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50 dark:border-zinc-700 dark:text-zinc-300 dark:has-[:checked]:bg-blue-950"
            >
              <input
                type="checkbox"
                name="types"
                value={t}
                defaultChecked={demande?.types.includes(t) ?? false}
                className="sr-only"
              />
              {TYPE_BIEN_LABELS[t]}
            </label>
          ))}
        </div>
      </div>

      {/* Zones ciblées (plusieurs) */}
      <div>
        <span className={labelClasse}>Zones ciblées</span>
        <div className="max-h-52 space-y-3 overflow-y-auto rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
          {zonesParVille.map(({ ville, liste }) => (
            <div key={ville}>
              <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {ville}
              </p>
              <div className="flex flex-wrap gap-2">
                {liste.map((z) => (
                  <label
                    key={z.id}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1 text-sm text-zinc-700 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50 dark:border-zinc-700 dark:text-zinc-300 dark:has-[:checked]:bg-blue-950"
                  >
                    <input
                      type="checkbox"
                      name="zoneIds"
                      value={z.id}
                      defaultChecked={demande?.zoneIds.includes(z.id) ?? false}
                      className="sr-only"
                    />
                    {z.nom}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget et critères */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="budgetMin" className={labelClasse}>
            Budget min (FCFA)
          </label>
          <input id="budgetMin" name="budgetMin" type="number" min="0" step="1" defaultValue={demande?.budgetMin ?? ""} className={champClasse} />
        </div>
        <div>
          <label htmlFor="budgetMax" className={labelClasse}>
            Budget max (FCFA)
          </label>
          <input id="budgetMax" name="budgetMax" type="number" min="0" step="1" defaultValue={demande?.budgetMax ?? ""} className={champClasse} />
        </div>
        <div>
          <label htmlFor="nombreChambresMin" className={labelClasse}>
            Chambres min
          </label>
          <input id="nombreChambresMin" name="nombreChambresMin" type="number" min="0" step="1" defaultValue={demande?.nombreChambresMin ?? ""} className={champClasse} />
        </div>
        <div>
          <label htmlFor="surfaceMin" className={labelClasse}>
            Surface min (m²)
          </label>
          <input id="surfaceMin" name="surfaceMin" type="number" min="1" step="1" defaultValue={demande?.surfaceMin ?? ""} className={champClasse} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className={labelClasse}>
          Notes
        </label>
        <textarea id="notes" name="notes" rows={3} defaultValue={demande?.notes ?? ""} className={champClasse} />
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
            : "Enregistrer la demande"}
      </button>
    </form>
  );
}
