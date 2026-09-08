"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  STATUTS_RENDEZ_VOUS,
  STATUT_RENDEZ_VOUS_LABELS,
  type StatutRendezVous,
} from "@/types/rendez-vous";
import { changerStatutRdv } from "@/services/rendez-vous-actions";

/** Changement rapide du statut d'un rendez-vous (boutons). */
export default function ActionsRendezVous({
  id,
  statut,
}: {
  id: string;
  statut: StatutRendezVous;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function changer(nouveau: StatutRendezVous) {
    if (nouveau === statut) return;
    setErreur(null);
    startTransition(async () => {
      const res = await changerStatutRdv(id, nouveau);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {STATUTS_RENDEZ_VOUS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => changer(s)}
            disabled={pending}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
              s === statut
                ? "border-blue-700 bg-blue-900 text-white"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            {STATUT_RENDEZ_VOUS_LABELS[s]}
          </button>
        ))}
      </div>
      {erreur && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {erreur}
        </p>
      )}
    </div>
  );
}
