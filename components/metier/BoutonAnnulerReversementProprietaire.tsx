"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import {
  supprimerReversementProprietaire,
  type ReversementState,
} from "@/services/reversements-actions";

const initialState: ReversementState = { error: null };

/** Annule le reversement d'un propriétaire (suppression logique). Confirme d'abord. */
export default function BoutonAnnulerReversementProprietaire({
  id,
  mois,
}: {
  id: string;
  mois: string;
}) {
  const [, formAction, isPending] = useActionState(
    supprimerReversementProprietaire.bind(null, id, mois),
    initialState
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Annuler ce reversement ?")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        title="Annuler ce reversement"
        className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2.5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-red-950"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Annuler
      </button>
    </form>
  );
}
