"use client";

import { useActionState } from "react";
import {
  MODES_PAIEMENT,
  MODE_PAIEMENT_LABELS,
  type BienLouable,
} from "@/types/bail";
import { creerBail, type CreerBailState } from "@/services/baux-actions";
import { champClasse, labelClasse } from "./champsBien";

const initialState: CreerBailState = { error: null };

/**
 * Formulaire de création d'un bail. Le locataire se saisit par nom + téléphone
 * (trouvé-ou-créé côté serveur, comme un propriétaire de bien). Seuls le bien, le
 * locataire et le loyer sont obligatoires ; le reste est replié dans l'esprit
 * « saisie légère » du projet. `aujourdhui` vient du serveur pour éviter tout
 * décalage d'hydratation sur la date par défaut.
 */
export default function FormulaireBail({
  biens,
  aujourdhui,
}: {
  biens: BienLouable[];
  aujourdhui: string;
}) {
  const [state, formAction, isPending] = useActionState(creerBail, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {/* Bien */}
      <div>
        <label htmlFor="bienId" className={labelClasse}>
          Bien loué
        </label>
        <select id="bienId" name="bienId" required defaultValue={biens[0]?.id ?? ""} className={champClasse}>
          {biens.length === 0 && <option value="">Aucun bien disponible</option>}
          {biens.map((b) => (
            <option key={b.id} value={b.id}>
              {b.reference} — {b.titre || "sans titre"}
            </option>
          ))}
        </select>
      </div>

      {/* Locataire : nom + téléphone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="locataireNom" className={labelClasse}>
            Nom du locataire
          </label>
          <input id="locataireNom" name="locataireNom" required className={champClasse} />
        </div>
        <div>
          <label htmlFor="locataireTelephone" className={labelClasse}>
            Téléphone du locataire
          </label>
          <input
            id="locataireTelephone"
            name="locataireTelephone"
            type="tel"
            required
            className={champClasse}
          />
        </div>
      </div>

      {/* Loyer + charges */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="loyerMensuel" className={labelClasse}>
            Loyer mensuel (FCFA)
          </label>
          <input
            id="loyerMensuel"
            name="loyerMensuel"
            type="number"
            min="1"
            step="1"
            required
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="chargesMensuelles" className={labelClasse}>
            Charges mensuelles (FCFA) <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="chargesMensuelles"
            name="chargesMensuelles"
            type="number"
            min="0"
            step="1"
            className={champClasse}
          />
        </div>
      </div>

      {/* Caution + jour d'échéance */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cautionMois" className={labelClasse}>
            Caution <span className="text-zinc-400">(en mois de loyer)</span>
          </label>
          <input
            id="cautionMois"
            name="cautionMois"
            type="number"
            min="0"
            step="1"
            placeholder="ex. 2"
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="jourEcheance" className={labelClasse}>
            Jour d&apos;échéance <span className="text-zinc-400">(1 à 28)</span>
          </label>
          <input
            id="jourEcheance"
            name="jourEcheance"
            type="number"
            min="1"
            max="28"
            step="1"
            defaultValue={1}
            className={champClasse}
          />
        </div>
      </div>

      {/* Mode de paiement habituel : > 4 options → liste déroulante */}
      <div>
        <label htmlFor="modePaiement" className={labelClasse}>
          Mode de paiement habituel <span className="text-zinc-400">(optionnel)</span>
        </label>
        <select id="modePaiement" name="modePaiement" defaultValue="" className={champClasse}>
          <option value="">—</option>
          {MODES_PAIEMENT.map((m) => (
            <option key={m} value={m}>
              {MODE_PAIEMENT_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      {/* Dates (optionnelles) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="dateDebut" className={labelClasse}>
            Début <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="dateDebut"
            name="dateDebut"
            type="date"
            defaultValue={aujourdhui}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="dateFin" className={labelClasse}>
            Fin <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input id="dateFin" name="dateFin" type="date" className={champClasse} />
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
        disabled={isPending || biens.length === 0}
        className="w-full rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Enregistrement…" : "Enregistrer le bail"}
      </button>
    </form>
  );
}
