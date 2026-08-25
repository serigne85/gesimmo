"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  TYPE_MANDAT_LABELS,
  COMMISSION_UNITES,
  COMMISSION_UNITE_LABELS,
  type TypeMandat,
  type CommissionUnite,
  type BienSelectionnable,
} from "@/types/mandat";
import { creerMandat, type CreerMandatState } from "@/services/mandats-actions";
import { champClasse, labelClasse } from "./champsBien";

const initialState: CreerMandatState = { error: null };

/**
 * Valeurs par défaut par nature de mandat (usages courants à Dakar, toutes
 * modifiables) : durée du mandat + rémunération (unité et valeur).
 */
const DEFAUTS: Record<
  TypeMandat,
  { dureeMois: number; unite: CommissionUnite; valeur: number }
> = {
  vente: { dureeMois: 3, unite: "pourcentage", valeur: 5 },
  location: { dureeMois: 3, unite: "mois", valeur: 1 },
  gerance: { dureeMois: 12, unite: "pourcentage", valeur: 10 },
};

/** Natures de mandat possibles selon l'objectif du bien. */
function naturesPour(
  bien: BienSelectionnable | null | undefined
): TypeMandat[] {
  if (!bien) return ["vente", "location", "gerance"];
  return bien.objectif === "vente" ? ["vente"] : ["location", "gerance"];
}

/** Ajoute des mois à une date « AAAA-MM-JJ » (calcul en UTC, sans dérive TZ). */
function ajouterMois(iso: string, mois: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCMonth(date.getUTCMonth() + mois);
  return date.toISOString().slice(0, 10);
}

/**
 * Formulaire de création d'un mandat. Le bien porte le propriétaire (= mandant,
 * affiché en lecture seule) et son objectif restreint les natures possibles :
 * un bien en vente ⇒ mandat de vente ; un bien en location ⇒ location ou gérance.
 * Les champs sont pré-remplis (date d'effet, date de fin, rémunération) selon la
 * nature, et recalculés quand elle change. `aujourdhui` vient du serveur pour
 * éviter tout décalage d'hydratation.
 */
export default function FormulaireMandat({
  biens,
  aujourdhui,
}: {
  biens: BienSelectionnable[];
  aujourdhui: string;
}) {
  const [state, formAction, isPending] = useActionState(creerMandat, initialState);

  const [bienId, setBienId] = useState(biens[0]?.id ?? "");
  const bien = useMemo(
    () => biens.find((b) => b.id === bienId) ?? null,
    [biens, bienId]
  );

  const typesDispo: TypeMandat[] = useMemo(() => naturesPour(bien), [bien]);

  const typeInitial = naturesPour(biens[0])[0];
  const [type, setType] = useState<TypeMandat>(typeInitial);
  const [unite, setUnite] = useState<CommissionUnite>(DEFAUTS[typeInitial].unite);
  const [valeur, setValeur] = useState<string>(String(DEFAUTS[typeInitial].valeur));
  const [dateDebut, setDateDebut] = useState<string>(aujourdhui);
  const [dateFin, setDateFin] = useState<string>(
    ajouterMois(aujourdhui, DEFAUTS[typeInitial].dureeMois)
  );

  /** Applique les valeurs par défaut d'une nature (unité, valeur, date de fin). */
  function appliquerDefauts(t: TypeMandat, debut: string) {
    setUnite(DEFAUTS[t].unite);
    setValeur(String(DEFAUTS[t].valeur));
    setDateFin(ajouterMois(debut, DEFAUTS[t].dureeMois));
  }

  // Quand le bien change, on réaligne la nature et ses valeurs par défaut.
  function changerBien(id: string) {
    setBienId(id);
    const dispo = naturesPour(biens.find((x) => x.id === id));
    if (!dispo.includes(type)) {
      setType(dispo[0]);
      appliquerDefauts(dispo[0], dateDebut);
    }
  }

  function changerType(t: TypeMandat) {
    setType(t);
    appliquerDefauts(t, dateDebut);
  }

  const venteSansJuridique =
    type === "vente" && !!bien && !bien.statutJuridique;

  return (
    <form action={formAction} className="space-y-5">
      {/* Bien */}
      <div>
        <label htmlFor="bienId" className={labelClasse}>
          Bien concerné
        </label>
        <select
          id="bienId"
          name="bienId"
          required
          value={bienId}
          onChange={(e) => changerBien(e.target.value)}
          className={champClasse}
        >
          {biens.length === 0 && <option value="">Aucun bien disponible</option>}
          {biens.map((b) => (
            <option key={b.id} value={b.id}>
              {b.reference} — {b.titre || "sans titre"}
            </option>
          ))}
        </select>
        {bien && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Mandant : <span className="font-medium">{bien.proprietaireNom || "—"}</span>
          </p>
        )}
      </div>

      {/* Nature : ≤ 3 options → boutons (CLAUDE.md) */}
      <div>
        <span className={labelClasse}>Nature du mandat</span>
        <input type="hidden" name="type" value={type} />
        <div className="flex gap-2">
          {typesDispo.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => changerType(t)}
              className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                type === t
                  ? "border-blue-700 bg-blue-900 text-white"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              {TYPE_MANDAT_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {venteSansJuridique && (
        <p className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Ce bien n&apos;a pas de statut juridique : un mandat de vente est
          impossible tant qu&apos;il n&apos;est pas renseigné sur sa fiche.
        </p>
      )}

      {/* Exclusivité */}
      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          name="exclusif"
          className="h-4 w-4 rounded border-zinc-300 text-blue-900 focus:ring-blue-600"
        />
        Mandat exclusif
      </label>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dateDebut" className={labelClasse}>
            Date d&apos;effet
          </label>
          <input
            id="dateDebut"
            name="dateDebut"
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="dateFin" className={labelClasse}>
            Fin
          </label>
          <input
            id="dateFin"
            name="dateFin"
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className={champClasse}
          />
        </div>
      </div>

      {/* Rémunération : valeur + unité */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="commissionValeur" className={labelClasse}>
            Rémunération <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="commissionValeur"
            name="commissionValeur"
            type="number"
            min="0"
            step="any"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="commissionUnite" className={labelClasse}>
            Unité
          </label>
          <select
            id="commissionUnite"
            name="commissionUnite"
            value={unite}
            onChange={(e) => setUnite(e.target.value as CommissionUnite)}
            className={champClasse}
          >
            {COMMISSION_UNITES.map((u) => (
              <option key={u} value={u}>
                {COMMISSION_UNITE_LABELS[u]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className={labelClasse}>
          Notes
        </label>
        <textarea id="notes" name="notes" rows={3} className={champClasse} />
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || biens.length === 0 || venteSansJuridique}
        className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Enregistrement…" : "Enregistrer le mandat"}
      </button>
    </form>
  );
}
