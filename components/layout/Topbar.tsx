"use client";

import { Menu, Search } from "lucide-react";

type TopbarProps = {
  /** Ouvre le tiroir de navigation sur mobile. */
  onOpenMenu: () => void;
};

/**
 * Barre supérieure : bouton menu (mobile), recherche, zone profil.
 *
 * Client Component car le bouton menu déclenche un handler (onClick).
 *
 * NOTE : le champ de recherche est VISUEL uniquement à ce stade. Aucune logique
 * n'est branchée — on le câblera au lot 2 (recherche biens / contacts).
 */
export default function Topbar({ onOpenMenu }: TopbarProps) {
  return (
    <header className="flex h-16 items-center gap-3 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Bouton menu : visible seulement sous le point de rupture lg (mobile/tablette). */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-900"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Recherche (inactive pour l'instant) */}
      <div className="relative max-w-md flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
        <input
          type="search"
          disabled
          placeholder="Rechercher un bien, un contact…"
          className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-700 placeholder:text-zinc-400 disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        />
      </div>

      {/* Zone profil (placeholder — sera branché avec l'auth) */}
      <div className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-900 text-sm font-medium text-white">
        M2S
      </div>
    </header>
  );
}
