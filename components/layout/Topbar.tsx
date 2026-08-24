"use client";

import { LogOut, Menu, Search } from "lucide-react";
import { deconnexion } from "@/services/auth-actions";

type TopbarProps = {
  /** Ouvre le tiroir de navigation sur mobile. */
  onOpenMenu: () => void;
  /** Nom de l'utilisateur connecté. */
  userName: string;
};

/** Deux premières initiales à partir du nom complet (ex : "Awa Ndiaye" → "AN"). */
function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Barre supérieure : bouton menu (mobile), recherche, zone profil.
 *
 * Client Component car le bouton menu déclenche un handler (onClick).
 *
 * NOTE : le champ de recherche est VISUEL uniquement à ce stade. Aucune logique
 * n'est branchée — on le câblera au lot 2 (recherche biens / contacts).
 */
export default function Topbar({ onOpenMenu, userName }: TopbarProps) {
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

      {/* Zone profil : initiales, nom, et déconnexion */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-900 text-sm font-medium text-white">
          {getInitials(userName)}
        </div>
        <span className="hidden text-sm font-medium text-zinc-700 sm:inline dark:text-zinc-200">
          {userName}
        </span>
        {/* La déconnexion est une Server Action : un <form> l'appelle sans API. */}
        <form action={deconnexion}>
          <button
            type="submit"
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>
      </div>
    </header>
  );
}
