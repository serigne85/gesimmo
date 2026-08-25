"use client";

import { champClasse, labelClasse } from "./champsBien";

/**
 * Personnes rattachées au bien, à la CRÉATION seulement (en édition, les
 * contacts se gèrent depuis le module Contacts) : le propriétaire (obligatoire)
 * et un contact secondaire optionnel (gardien, mandataire, personne qui fait
 * visiter). Les deux champs du contact vont de pair (validé côté serveur).
 */
export default function ChampsContactsBien() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="proprietaireNom" className={labelClasse}>
            Nom du propriétaire
          </label>
          <input
            id="proprietaireNom"
            name="proprietaireNom"
            type="text"
            required
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="proprietaireTelephone" className={labelClasse}>
            Téléphone du propriétaire
          </label>
          <input
            id="proprietaireTelephone"
            name="proprietaireTelephone"
            type="tel"
            required
            placeholder="77 123 45 67"
            className={champClasse}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contactNom" className={labelClasse}>
            Nom du contact <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="contactNom"
            name="contactNom"
            type="text"
            className={champClasse}
          />
        </div>
        <div>
          <label htmlFor="contactTelephone" className={labelClasse}>
            Téléphone du contact <span className="text-zinc-400">(optionnel)</span>
          </label>
          <input
            id="contactTelephone"
            name="contactTelephone"
            type="tel"
            placeholder="77 123 45 67"
            className={champClasse}
          />
        </div>
      </div>
    </div>
  );
}
