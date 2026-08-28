"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import {
  supprimerReversement,
  type ReversementState,
} from "@/services/reversements-actions";

const initialState: ReversementState = { error: null };

/** Annule un reversement (suppression logique). Confirmation avant envoi. */
export default function BoutonAnnulerReversement({
  id,
  bailId,
}: {
  id: string;
  bailId: string;
}) {
  const [, formAction, isPending] = useActionState(
    supprimerReversement.bind(null, id, bailId),
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
        className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-950"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
