"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  NIVEAUX_INTERET,
  NIVEAU_INTERET_LABELS,
  type CompteRenduVisite,
} from "@/types/rendez-vous";
import { enregistrerCompteRendu } from "@/services/rendez-vous-actions";
import { champClasse, labelClasse } from "./champsBien";

/**
 * Compte rendu d'une visite (création ou mise à jour). Rattaché au rendez-vous ;
 * l'enregistrer passe la visite à « réalisé ». On appelle l'action puis on
 * rafraîchit (elle renvoie {error} sans redirection).
 */
export default function FormulaireCompteRendu({
  rendezVousId,
  compteRendu,
}: {
  rendezVousId: string;
  compteRendu: CompteRenduVisite | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const interesseInitial =
    compteRendu?.interesse === true
      ? "oui"
      : compteRendu?.interesse === false
        ? "non"
        : "";

  function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErreur(null);
    setOk(false);
    startTransition(async () => {
      const res = await enregistrerCompteRendu(
        rendezVousId,
        { error: null },
        formData
      );
      if (res.error) setErreur(res.error);
      else {
        setOk(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="interesse" className={labelClasse}>
            Client intéressé ?
          </label>
          <select
            id="interesse"
            name="interesse"
            defaultValue={interesseInitial}
            className={champClasse}
          >
            <option value="">—</option>
            <option value="oui">Oui</option>
            <option value="non">Non</option>
          </select>
        </div>
        <div>
          <label htmlFor="niveauInteret" className={labelClasse}>
            Niveau d&apos;intérêt
          </label>
          <select
            id="niveauInteret"
            name="niveauInteret"
            defaultValue={compteRendu?.niveauInteret ?? ""}
            className={champClasse}
          >
            <option value="">—</option>
            {NIVEAUX_INTERET.map((n) => (
              <option key={n} value={n}>
                {NIVEAU_INTERET_LABELS[n]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="compteRendu" className={labelClasse}>
          Compte rendu
        </label>
        <textarea
          id="compteRendu"
          name="compteRendu"
          rows={4}
          required
          maxLength={4000}
          defaultValue={compteRendu?.compteRendu ?? ""}
          className={champClasse}
        />
      </div>

      <div>
        <label htmlFor="suiteADonner" className={labelClasse}>
          Suite à donner <span className="text-zinc-400">(optionnel)</span>
        </label>
        <textarea
          id="suiteADonner"
          name="suiteADonner"
          rows={2}
          maxLength={2000}
          defaultValue={compteRendu?.suiteADonner ?? ""}
          className={champClasse}
        />
      </div>

      {erreur && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {erreur}
        </p>
      )}
      {ok && !erreur && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Compte rendu enregistré.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer le compte rendu"}
      </button>
    </form>
  );
}
