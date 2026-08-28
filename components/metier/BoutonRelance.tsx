"use client";

import { useActionState } from "react";
import { BellRing } from "lucide-react";
import { marquerRelance, type RelanceState } from "@/services/relances-actions";
import { formatDate } from "@/lib/utils/format";

const initialState: RelanceState = { error: null };

/**
 * Marque une échéance comme relancée (pose la date du jour) et affiche la date
 * de la dernière relance. Marqueur léger en attendant le module Tâches.
 */
export default function BoutonRelance({
  echeanceId,
  derniereRelanceLe,
}: {
  echeanceId: string;
  derniereRelanceLe: string | null;
}) {
  const [, formAction, isPending] = useActionState(
    marquerRelance.bind(null, echeanceId),
    initialState
  );

  return (
    <form action={formAction} className="flex items-center gap-1">
      {derniereRelanceLe && (
        <span className="text-xs text-zinc-400" title="Dernière relance">
          Relancé {formatDate(derniereRelanceLe)}
        </span>
      )}
      <button
        type="submit"
        disabled={isPending}
        title="Marquer relancé aujourd'hui"
        className="rounded-md p-1.5 text-zinc-400 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-60 dark:hover:bg-amber-950"
      >
        <BellRing className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
