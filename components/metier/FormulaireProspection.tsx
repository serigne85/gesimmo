"use client";

import { useActionState, useMemo, useState } from "react";
import {
  STATUTS_PROSPECTION,
  STATUT_PROSPECTION_LABELS,
  type StatutProspection,
  type ProspectionEdition,
} from "@/types/prospection";
import type { ZoneOption } from "@/services/reference";
import {
  creerProspection,
  modifierProspection,
  type ProspectionState,
} from "@/services/prospections-actions";
import { champClasse, labelClasse } from "./champsBien";

const initialState: ProspectionState = { error: null };

/**
 * Formulaire de prospection terrain, deux modes : `prospection` absent =
 * création, présent = édition. Saisie légère : seuls le nom et le téléphone du
 * propriétaire sont requis (champs séparés). La date de relance n'apparaît que
 * si le statut est « à relancer ».
 */
export default function FormulaireProspection({
  zones,
  aujourdhui,
  prospection,
}: {
  zones: ZoneOption[];
  aujourdhui: string;
  prospection?: ProspectionEdition;
}) {
  const isEdition = !!prospection;
  const action = isEdition
    ? modifierProspection.bind(null, prospection.id)
    : creerProspection;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [statut, setStatut] = useState<StatutProspection>(
    prospection?.statut ?? "disponible"
  );

  // Zones groupées par ville, pour une liste déroulante lisible.
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
      {/* Propriétaire pressenti : nom et téléphone séparés, tous deux requis */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nomComplet" className={labelClasse}>
            Nom du propriétaire
          </label>
          <input
            id="nomComplet"
            name="nomComplet"
            type="text"
            required
            maxLength={150}
            defaultValue={prospection?.nomComplet ?? ""}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="telephone" className={labelClasse}>
            Téléphone
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            required
            maxLength={30}
            defaultValue={prospection?.telephone ?? ""}
            className={champClasse}
          />
        </div>
      </div>

      {/* Date de prospection */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dateProspection" className={labelClasse}>
            Date de prospection
          </label>
          <input
            id="dateProspection"
            name="dateProspection"
            type="date"
            defaultValue={prospection?.dateProspection ?? aujourdhui}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="zoneId" className={labelClasse}>
            Zone <span className="text-zinc-400">(optionnel)</span>
          </label>
          <select
            id="zoneId"
            name="zoneId"
            defaultValue={prospection?.zoneId ?? ""}
            className={champClasse}
          >
            <option value="">— Choisir une zone —</option>
            {zonesParVille.map(({ ville, liste }) => (
              <optgroup key={ville} label={ville}>
                {liste.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nom}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Produit prospecté (texte libre : mappé vers type/objectif à la conversion) */}
      <div>
        <label htmlFor="produit" className={labelClasse}>
          Produit <span className="text-zinc-400">(ex. « villa à vendre »)</span>
        </label>
        <input
          id="produit"
          name="produit"
          type="text"
          maxLength={200}
          defaultValue={prospection?.produit ?? ""}
          className={champClasse}
        />
      </div>

      {/* Statut : 3 options → boutons (CLAUDE.md) */}
      <div>
        <span className={labelClasse}>Statut</span>
        <input type="hidden" name="statut" value={statut} />
        <div className="flex gap-2">
          {STATUTS_PROSPECTION.map((val) => (
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
              {STATUT_PROSPECTION_LABELS[val]}
            </button>
          ))}
        </div>
      </div>

      {/* Date de relance : seulement si statut = à relancer */}
      {statut === "a_relancer" && (
        <div className="sm:w-1/2">
          <label htmlFor="dateRelance" className={labelClasse}>
            Date de relance
          </label>
          <input
            id="dateRelance"
            name="dateRelance"
            type="date"
            required
            defaultValue={prospection?.dateRelance ?? ""}
            className={champClasse}
          />
        </div>
      )}

      {/* Personne à contacter (relais) : nom et téléphone séparés */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contactNom" className={labelClasse}>
            Personne à contacter <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="contactNom"
            name="contactNom"
            type="text"
            maxLength={150}
            defaultValue={prospection?.contactNom ?? ""}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="contactTel" className={labelClasse}>
            Téléphone du contact <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="contactTel"
            name="contactTel"
            type="tel"
            maxLength={30}
            defaultValue={prospection?.contactTel ?? ""}
            className={champClasse}
          />
        </div>
      </div>

      {/* Observation */}
      <div>
        <label htmlFor="observation" className={labelClasse}>
          Observation <span className="text-zinc-400">(optionnel)</span>
        </label>
        <textarea
          id="observation"
          name="observation"
          rows={3}
          maxLength={2000}
          defaultValue={prospection?.observation ?? ""}
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
        className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
      >
        {isPending
          ? "Enregistrement…"
          : isEdition
            ? "Enregistrer les modifications"
            : "Enregistrer la prospection"}
      </button>
    </form>
  );
}
