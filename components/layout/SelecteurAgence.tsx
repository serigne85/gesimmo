"use client";

import { Building2 } from "lucide-react";
import { changerAgenceActive } from "@/services/agences-actions";
import type { AgenceOption } from "@/types/utilisateur";

/**
 * Sélecteur d'agence pour le super-admin. Rendu uniquement pour lui (le layout
 * ne le fournit pas aux autres). Changer la sélection soumet le formulaire :
 * l'action serveur enregistre l'agence active, invalide le cache et recharge.
 * La sécurité ne dépend pas de ce composant — la RLS verrouille en base.
 */
export default function SelecteurAgence({
  agences,
  agenceActiveId,
}: {
  agences: AgenceOption[];
  agenceActiveId: string;
}) {
  if (agences.length < 2) return null;

  return (
    <form action={changerAgenceActive} className="flex items-center">
      <label className="sr-only" htmlFor="agence-active">
        Agence active
      </label>
      <div className="relative flex items-center">
        <Building2
          className="pointer-events-none absolute left-2.5 h-4 w-4 text-zinc-400"
          aria-hidden="true"
        />
        <select
          id="agence-active"
          name="agenceId"
          defaultValue={agenceActiveId}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="appearance-none rounded-md border border-zinc-300 bg-white py-1.5 pl-8 pr-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {agences.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
              {a.ville ? ` — ${a.ville}` : ""}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
