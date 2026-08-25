"use client";

import { Star, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import type { PhotoBien } from "@/types/photo";

/**
 * Une vignette de photo avec sa barre d'actions (toujours visible, pour le
 * mobile) : définir comme principale, déplacer, supprimer. Purement présentatif :
 * les actions remontent au parent via les callbacks.
 */
export default function TuilePhoto({
  photo,
  isFirst,
  isLast,
  disabled,
  onPrincipale,
  onDeplacer,
  onSupprimer,
}: {
  photo: PhotoBien;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onPrincipale: (id: string) => void;
  onDeplacer: (id: string, sens: "avant" | "apres") => void;
  onSupprimer: (id: string) => void;
}) {
  const btn =
    "rounded p-1.5 text-white transition-colors hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <li className="relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt="Photo du bien"
        loading="lazy"
        className="h-full w-full object-cover"
      />

      {photo.estPrincipale && (
        <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-blue-900/90 px-2 py-0.5 text-xs font-medium text-white">
          <Star className="h-3 w-3" aria-hidden="true" />
          Principale
        </span>
      )}

      {/* Barre d'actions */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-1 py-0.5">
        <button
          type="button"
          className={btn}
          disabled={disabled || photo.estPrincipale}
          title={photo.estPrincipale ? "Photo principale" : "Définir comme principale"}
          onClick={() => onPrincipale(photo.id)}
        >
          <Star
            className="h-4 w-4"
            fill={photo.estPrincipale ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>

        <div className="flex items-center">
          <button
            type="button"
            className={btn}
            disabled={disabled || isFirst}
            title="Déplacer avant"
            onClick={() => onDeplacer(photo.id, "avant")}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={btn}
            disabled={disabled || isLast}
            title="Déplacer après"
            onClick={() => onDeplacer(photo.id, "apres")}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className={`${btn} text-red-300 hover:bg-red-500/30`}
          disabled={disabled}
          title="Supprimer la photo"
          onClick={() => onSupprimer(photo.id)}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
