"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Eye, ExternalLink } from "lucide-react";
import {
  TYPE_TACHE_LABELS,
  PRIORITE_TACHE_LABELS,
  LIEN_TACHE_BASE,
  LIEN_TACHE_LABELS,
  type TacheListe,
} from "@/types/tache";
import { formatDate } from "@/lib/utils/format";
import { changerStatutTache } from "@/services/taches-actions";
import BadgeStatutTache from "./BadgeStatutTache";

/** Couleur de la pastille de priorité. */
const POINT_PRIORITE: Record<TacheListe["priorite"], string> = {
  basse: "bg-zinc-300 dark:bg-zinc-600",
  normale: "bg-blue-500",
  haute: "bg-red-500",
};

export default function TableauTaches({
  taches,
  aujourdhui,
}: {
  taches: TacheListe[];
  aujourdhui: string; // AAAA-MM-JJ, fourni par le serveur
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function marquerFaite(id: string) {
    setErreur(null);
    startTransition(async () => {
      const res = await changerStatutTache(id, "faite");
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  function classeEcheance(date: string | null, statut: string): string {
    if (!date) return "text-zinc-400";
    if (statut === "faite" || statut === "annulee")
      return "text-zinc-400 line-through";
    const jour = date.slice(0, 10);
    if (jour < aujourdhui) return "font-medium text-red-700 dark:text-red-400";
    if (jour === aujourdhui)
      return "font-medium text-amber-700 dark:text-amber-500";
    return "text-zinc-700 dark:text-zinc-300";
  }

  return (
    <div className="space-y-3">
      {erreur && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {erreur}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="w-10 px-3 py-2" />
              <th className="px-3 py-2 font-medium">Tâche</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Échéance</th>
              <th className="px-3 py-2 font-medium">Assignée</th>
              <th className="px-3 py-2 font-medium">Statut</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {taches.map((t) => {
              const fini = t.statut === "faite" || t.statut === "annulee";
              return (
                <tr
                  key={t.id}
                  className="text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => marquerFaite(t.id)}
                      disabled={pending || fini}
                      title={fini ? "Terminée" : "Marquer faite"}
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors disabled:opacity-60 ${
                        t.statut === "faite"
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-zinc-300 hover:border-green-600 dark:border-zinc-600"
                      }`}
                    >
                      {t.statut === "faite" && (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${POINT_PRIORITE[t.priorite]}`}
                        title={`Priorité ${PRIORITE_TACHE_LABELS[t.priorite].toLowerCase()}`}
                      />
                      <Link
                        href={`/taches/${t.id}`}
                        className={`font-medium hover:underline ${
                          fini
                            ? "text-zinc-400"
                            : "text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {t.titre}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {TYPE_TACHE_LABELS[t.type]}
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap ${classeEcheance(t.dateEcheance, t.statut)}`}
                  >
                    {t.dateEcheance ? formatDate(t.dateEcheance) : "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {t.assigneeNom ?? "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <BadgeStatutTache statut={t.statut} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {t.lienType && t.lienId && (
                        <Link
                          href={`${LIEN_TACHE_BASE[t.lienType]}/${t.lienId}`}
                          className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          title={`Voir ${LIEN_TACHE_LABELS[t.lienType].toLowerCase()}`}
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      )}
                      <Link
                        href={`/taches/${t.id}`}
                        className="rounded-md p-2 text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
                        title="Voir la tâche"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
