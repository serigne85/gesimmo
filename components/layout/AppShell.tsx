"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { getNavigationForRole } from "@/lib/navigation";
import type { Role } from "@/types/roles";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppShellProps = {
  /**
   * Rôle de l'utilisateur, fourni par le layout serveur.
   * On reçoit une CHAÎNE (sérialisable), pas la liste d'entrées : les entrées
   * contiennent des composants icône (des fonctions), qui ne peuvent pas
   * traverser la frontière serveur → client. On filtre donc ici, côté client,
   * où les icônes ont le droit d'exister.
   */
  role: Role;
  /** Nom affiché dans la topbar. */
  userName: string;
  /** Le contenu de la page en cours. */
  children: React.ReactNode;
};

/**
 * Coquille de l'application : sidebar + topbar + zone de contenu.
 *
 * Client Component car il DÉTIENT un état : `isDrawerOpen`, qui dit si le tiroir
 * de navigation mobile est ouvert. useState = mémoire locale d'un composant qui
 * survit aux re-rendus ; changer sa valeur redessine l'interface.
 *
 * Sur grand écran (lg+), la sidebar est fixe à gauche.
 * Sur mobile, elle est cachée et s'ouvre en tiroir par-dessus le contenu.
 */
export default function AppShell({ role, userName, children }: AppShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navItems = getNavigationForRole(role);

  return (
    <div className="flex h-full">
      {/* Sidebar fixe — visible seulement à partir de lg (ordinateur) */}
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 lg:block dark:border-zinc-800">
        <Sidebar items={navItems} />
      </aside>

      {/* Tiroir mobile — rendu uniquement quand il est ouvert */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Fond semi-transparent : un clic ferme le tiroir */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Panneau qui glisse depuis la gauche */}
          <div className="absolute inset-y-0 left-0 w-64 border-r border-zinc-200 shadow-xl dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="absolute right-2 top-3 rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            {/* onNavigate ferme le tiroir dès qu'on clique un lien */}
            <Sidebar items={navItems} onNavigate={() => setIsDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Colonne de droite : topbar + contenu défilant */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setIsDrawerOpen(true)} userName={userName} />
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 sm:p-6 dark:bg-zinc-900">
          {children}
        </main>
      </div>
    </div>
  );
}
