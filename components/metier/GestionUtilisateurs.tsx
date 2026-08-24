"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { UtilisateurListe } from "@/types/utilisateur";
import FormulaireUtilisateur from "./FormulaireUtilisateur";
import LigneUtilisateur from "./LigneUtilisateur";

type Props = {
  utilisateurs: UtilisateurListe[];
  /** id de l'admin connecté : pour désactiver les actions sur soi-même. */
  currentUserId: string;
};

/**
 * Écran de gestion des utilisateurs. Détient l'état d'ouverture du formulaire
 * (une seule action principale par écran, CLAUDE.md). La liste est rendue en
 * lignes bordées, pas en cartes : on pilote un stock.
 */
export default function GestionUtilisateurs({
  utilisateurs,
  currentUserId,
}: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Utilisateurs
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {utilisateurs.length} compte{utilisateurs.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvel utilisateur
        </button>
      </div>

      {showForm && (
        <FormulaireUtilisateur onSuccess={() => setShowForm(false)} />
      )}

      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {utilisateurs.map((u) => (
          <LigneUtilisateur
            key={u.id}
            utilisateur={u}
            estSoiMeme={u.id === currentUserId}
          />
        ))}
      </ul>
    </div>
  );
}
