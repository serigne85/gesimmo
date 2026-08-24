"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/navigation";

type SidebarProps = {
  /** Entrées déjà filtrées par rôle, fournies par le layout serveur. */
  items: NavItem[];
  /** Appelé après un clic sur un lien (sert à refermer le tiroir sur mobile). */
  onNavigate?: () => void;
};

/**
 * Barre latérale de navigation.
 *
 * Client Component ('use client') car elle utilise usePathname() : un hook qui
 * lit l'URL courante dans le navigateur pour surligner l'entrée active. Les
 * hooks ne fonctionnent que côté client.
 *
 * Elle ne connaît AUCUN lien en dur : elle boucle sur `items` avec .map().
 */
export default function Sidebar({ items, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-950">
      {/* En-tête / logo */}
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <span className="text-lg font-semibold tracking-tight text-blue-900 dark:text-blue-300">
          M2S IMMO
        </span>
      </div>

      {/* Liste des liens.
          .map() transforme chaque entrée de donnée en un élément JSX.
          La prop `key` (unique) aide React à suivre chaque ligne. */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {items.map((item) => {
            // Actif si l'URL est exactement le lien, ou une sous-page de ce lien.
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
