"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import {
  supprimerPaiement,
  type PaiementState,
} from "@/services/paiements-actions";

const initialState: PaiementState = { error: null };

/**
 * Bouton d'annulation d'un paiement (suppression logique). Confirmation avant
 * envoi ; le serveur recalcule ensuite le statut de l'échéance.
 */
export default function BoutonAnnulerPaiement({ id }: { id: string }) {
  const [, formAction, isPending] = useActionState(
    supprimerPaiement.bind(null, id),
    initialState
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Annuler ce paiement ?")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        title="Annuler ce paiement"
        className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:hover:bg-red-950"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
