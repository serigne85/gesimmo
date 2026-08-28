"use client";

import { useActionState } from "react";
import type { BienLouable } from "@/types/bail";
import { creerBail, type CreerBailState } from "@/services/baux-actions";
import { champClasse, labelClasse } from "./champsBien";
import ChampsBail from "./ChampsBail";

const initialState: CreerBailState = { error: null };

/**
 * Formulaire de création d'un bail. Le locataire se saisit par nom + téléphone
 * (trouvé-ou-créé côté serveur, comme un propriétaire de bien). Seuls le bien, le
 * locataire et le loyer sont obligatoires. Les champs communs (loyer, charges,
 * dates…) viennent de ChampsBail, partagé avec l'édition. `aujourdhui` vient du
 * serveur pour éviter tout décalage d'hydratation sur la date par défaut.
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

      <ChampsBail defauts={{ jourEcheance: 1, dateDebut: aujourdhui }} />

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
