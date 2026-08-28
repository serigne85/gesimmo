import { MODES_PAIEMENT, MODE_PAIEMENT_LABELS } from "@/types/bail";
import { champClasse, labelClasse } from "./champsBien";

/** Valeurs par défaut des champs communs d'un bail (création ou édition). */
export type DefautsBail = {
  loyerMensuel?: number | null;
  chargesMensuelles?: number | null;
  cautionMois?: number | null;
  jourEcheance?: number;
  modePaiement?: string | null;
  dateDebut?: string | null;
  dateFin?: string | null;
  notes?: string | null;
};

/** Convertit une valeur potentiellement nulle en `defaultValue` de champ. */
function val(v: number | string | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}

/**
 * Champs communs d'un bail (loyer, charges, caution, échéance, mode, dates,
 * notes). Partagés entre la création et l'édition pour éviter toute duplication.
 * Le bien et le locataire ne sont PAS ici : ils diffèrent selon le mode.
 */
export default function ChampsBail({ defauts = {} }: { defauts?: DefautsBail }) {
  return (
    <>
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
            defaultValue={val(defauts.loyerMensuel)}
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
            defaultValue={val(defauts.chargesMensuelles)}
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
            defaultValue={val(defauts.cautionMois)}
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
            defaultValue={defauts.jourEcheance ?? 1}
            className={champClasse}
          />
        </div>
      </div>

      {/* Mode de paiement habituel : > 4 options → liste déroulante */}
      <div>
        <label htmlFor="modePaiement" className={labelClasse}>
          Mode de paiement habituel <span className="text-zinc-400">(optionnel)</span>
        </label>
        <select
          id="modePaiement"
          name="modePaiement"
          defaultValue={defauts.modePaiement ?? ""}
          className={champClasse}
        >
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
            defaultValue={val(defauts.dateDebut)}
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="dateFin" className={labelClasse}>
            Fin <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="dateFin"
            name="dateFin"
            type="date"
            defaultValue={val(defauts.dateFin)}
            className={champClasse}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className={labelClasse}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={val(defauts.notes)}
          className={champClasse}
        />
      </div>
    </>
  );
}
