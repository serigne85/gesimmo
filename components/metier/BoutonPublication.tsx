"use client";

import { useActionState } from "react";
import { Globe, EyeOff, ExternalLink } from "lucide-react";
import { definirPublicationBien } from "@/services/biens-actions";
import { formatDate } from "@/lib/utils/format";
import type { StatutBien } from "@/types/bien";

/**
 * Publie / retire un bien du site vitrine. Un bien n'est visible publiquement
 * que s'il est « Disponible » ET publié : on ne peut donc publier qu'un bien
 * disponible (le serveur revalide de toute façon — masquer le bouton ne suffit
 * pas). L'action bascule vers l'état inverse de l'état courant.
 */
export default function BoutonPublication({
  id,
  statut,
  publie,
  publieLe,
}: {
  id: string;
  statut: StatutBien;
  publie: boolean;
  publieLe: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    definirPublicationBien.bind(null, id),
    { error: null }
  );

  const peutPublier = statut === "disponible";

  return (
    <div className="space-y-3">
      {publie ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
              <Globe className="h-3.5 w-3.5" aria-hidden="true" /> En ligne
            </span>
            {publieLe && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Publié le {formatDate(publieLe)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form action={formAction}>
              <input type="hidden" name="publier" value="0" />
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <EyeOff className="h-4 w-4" aria-hidden="true" />
                {isPending ? "Retrait…" : "Retirer du site"}
              </button>
            </form>
            <a
              href={`/nos-biens/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Voir la fiche publique
            </a>
          </div>
        </>
      ) : peutPublier ? (
        <form action={formAction}>
          <input type="hidden" name="publier" value="1" />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
          >
            <Globe className="h-4 w-4" aria-hidden="true" />
            {isPending ? "Publication…" : "Publier sur le site"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Le bien doit être au statut « Disponible » pour être publié sur le site.
        </p>
      )}

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {state.error}
        </p>
      )}
    </div>
  );
}
