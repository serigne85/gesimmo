"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  STATUTS_MISE_EN_RELATION,
  STATUT_MISE_EN_RELATION_LABELS,
  TYPES_SUIVI,
  TYPE_SUIVI_LABELS,
  type StatutMiseEnRelation,
  type SuiviEvenement,
} from "@/types/mise-en-relation";
import {
  changerStatutMiseEnRelation,
  ajouterSuivi,
} from "@/services/mises-en-relation-actions";
import { formatDate } from "@/lib/utils/format";
import { champClasse, labelClasse } from "./champsBien";

/**
 * Bloc interactif de la fiche mise en relation : changer le statut (avec la
 * commission encaissée à la conclusion), ajouter un événement au journal, et
 * afficher la chronologie. On appelle les actions serveur puis on rafraîchit —
 * elles renvoient un état {error} sans redirection.
 */
export default function SuiviMiseEnRelation({
  id,
  statut,
  suivi,
}: {
  id: string;
  statut: StatutMiseEnRelation;
  suivi: SuiviEvenement[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  // État local du sélecteur de statut, pour afficher le champ « encaissé » quand
  // on bascule sur « conclue ».
  const [statutChoisi, setStatutChoisi] =
    useState<StatutMiseEnRelation>(statut);

  function changerStatut(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErreur(null);
    startTransition(async () => {
      const res = await changerStatutMiseEnRelation(id, { error: null }, formData);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  function ajouter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setErreur(null);
    startTransition(async () => {
      const res = await ajouterSuivi(id, { error: null }, formData);
      if (res.error) setErreur(res.error);
      else {
        form.reset();
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {erreur && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {erreur}
        </p>
      )}

      {/* Changer le statut */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Faire avancer l&apos;affaire
        </h2>
        <form onSubmit={changerStatut} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="statut" className={labelClasse}>
                Nouveau statut
              </label>
              <select
                id="statut"
                name="statut"
                value={statutChoisi}
                onChange={(e) =>
                  setStatutChoisi(e.target.value as StatutMiseEnRelation)
                }
                className={champClasse}
              >
                {STATUTS_MISE_EN_RELATION.map((s) => (
                  <option key={s} value={s}>
                    {STATUT_MISE_EN_RELATION_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            {statutChoisi === "conclue" && (
              <div>
                <label htmlFor="commissionPercue" className={labelClasse}>
                  Commission encaissée (FCFA)
                </label>
                <input
                  id="commissionPercue"
                  name="commissionPercue"
                  type="number"
                  min="0"
                  step="1"
                  className={champClasse}
                />
              </div>
            )}
          </div>
          <div>
            <label htmlFor="note" className={labelClasse}>
              Note <span className="text-zinc-400">(optionnel)</span>
            </label>
            <input id="note" name="note" type="text" maxLength={2000} className={champClasse} />
          </div>
          {statutChoisi === "conclue" && (
            <p className="text-xs text-amber-700 dark:text-amber-500">
              Conclure marquera aussi la demande client comme « satisfaite ».
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
          >
            {pending ? "Enregistrement…" : "Mettre à jour le statut"}
          </button>
        </form>
      </div>

      {/* Ajouter un événement au journal */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Ajouter un suivi
        </h2>
        <form onSubmit={ajouter} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <div>
              <label htmlFor="type" className={labelClasse}>
                Type
              </label>
              <select id="type" name="type" defaultValue="note" className={champClasse}>
                {TYPES_SUIVI.filter((t) => t !== "changement_statut").map((t) => (
                  <option key={t} value={t}>
                    {TYPE_SUIVI_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="description" className={labelClasse}>
                Description
              </label>
              <input
                id="description"
                name="description"
                type="text"
                required
                maxLength={2000}
                placeholder="Ex. Le partenaire a envoyé deux photos de la villa"
                className={champClasse}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {pending ? "Enregistrement…" : "Ajouter au journal"}
          </button>
        </form>
      </div>

      {/* Journal chronologique */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Journal ({suivi.length})
        </h2>
        {suivi.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Aucun événement pour l&apos;instant.
          </p>
        ) : (
          <ol className="space-y-3">
            {suivi.map((e) => (
              <li
                key={e.id}
                className="border-l-2 border-zinc-200 pl-3 dark:border-zinc-700"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {TYPE_SUIVI_LABELS[e.type]}
                  </span>
                  <span>{formatDate(e.dateEvenement)}</span>
                  {e.auteurNom && <span>· {e.auteurNom}</span>}
                </div>
                <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                  {e.description}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
