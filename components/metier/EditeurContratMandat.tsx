"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Printer, RotateCcw } from "lucide-react";
import {
  enregistrerContratMandat,
  type ContratState,
} from "@/services/contrats-actions";

const initialState: ContratState = { error: null, success: false };

/**
 * Éditeur du contrat de mandat : le texte est pré-rempli (modèle fusionné avec
 * les données) et l'agent peut le retoucher avant d'enregistrer puis d'imprimer.
 * « Régénérer » recharge le texte depuis le modèle (annule les retouches).
 */
export default function EditeurContratMandat({
  mandatId,
  texteInitial,
  texteModele,
  modeleVide,
}: {
  mandatId: string;
  texteInitial: string;
  texteModele: string;
  modeleVide: boolean;
}) {
  const action = enregistrerContratMandat.bind(null, mandatId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [texte, setTexte] = useState(texteInitial);

  return (
    <div className="space-y-3">
      {modeleVide && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Aucun modèle de contrat n&apos;est encore défini pour cette nature.{" "}
          <Link href="/mandats/modeles" className="font-medium underline">
            Rédiger le modèle
          </Link>{" "}
          (texte constant à trous), puis revenez ici.
        </p>
      )}

      <form action={formAction} className="space-y-3">
        <textarea
          name="contratTexte"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={24}
          className="w-full rounded-md border border-zinc-300 bg-white p-3 font-mono text-sm leading-relaxed text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          placeholder="Le contrat apparaîtra ici une fois le modèle défini…"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>

          {!modeleVide && (
            <button
              type="button"
              onClick={() => setTexte(texteModele)}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Régénérer depuis le modèle
            </button>
          )}

          <Link
            href={`/mandats/${mandatId}/contrat/imprimer`}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Aperçu / Imprimer
          </Link>
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            Contrat enregistré. L&apos;aperçu et l&apos;impression reflètent cette version.
          </p>
        )}
      </form>
    </div>
  );
}
