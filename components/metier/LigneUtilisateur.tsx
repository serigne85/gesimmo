"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, Power, Trash2, X } from "lucide-react";
import { ROLES, ROLE_LABELS, type Role } from "@/types/roles";
import type { UtilisateurListe } from "@/types/utilisateur";
import {
  basculerActif,
  changerRole,
  modifierTelephone,
  supprimerUtilisateur,
} from "@/services/utilisateurs-actions";

type Props = {
  utilisateur: UtilisateurListe;
  /** true si cette ligne est l'admin connecté : on désactive les actions sur soi. */
  estSoiMeme: boolean;
};

/**
 * Une ligne de la liste des utilisateurs, avec ses actions.
 *
 * useTransition fournit `isPending` pendant qu'une Server Action s'exécute :
 * on désactive les contrôles pour éviter les doubles clics. Les actions sont
 * appelées directement (pas via un <form>) car déclenchées par un clic/select.
 */
export default function LigneUtilisateur({ utilisateur, estSoiMeme }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Édition inline du téléphone : `editPhone` = brouillon en cours, ou null si fermé.
  const [editPhone, setEditPhone] = useState<string | null>(null);

  function handleToggleActif() {
    startTransition(async () => {
      const res = await basculerActif(utilisateur.id, !utilisateur.actif);
      setError(res.error);
    });
  }

  function handleChangeRole(role: Role) {
    startTransition(async () => {
      const res = await changerRole(utilisateur.id, role);
      setError(res.error);
    });
  }

  function handleDelete() {
    if (!confirm(`Supprimer ${utilisateur.nomComplet} ?`)) return;
    startTransition(async () => {
      const res = await supprimerUtilisateur(utilisateur.id);
      setError(res.error);
    });
  }

  function handleSavePhone() {
    const value = editPhone ?? "";
    startTransition(async () => {
      const res = await modifierTelephone(utilisateur.id, value);
      setError(res.error);
      // On ne referme le champ que si l'enregistrement a réussi.
      if (!res.error) setEditPhone(null);
    });
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Identité + statut */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
            {utilisateur.nomComplet}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              utilisateur.actif
                ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {utilisateur.actif ? "Actif" : "Inactif"}
          </span>
        </div>
        {editPhone === null ? (
          <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="truncate">{utilisateur.email}</span>
            {utilisateur.telephone ? (
              <span className="shrink-0">· {utilisateur.telephone}</span>
            ) : (
              <span className="shrink-0 italic text-zinc-400">· sans téléphone</span>
            )}
            <button
              type="button"
              onClick={() => setEditPhone(utilisateur.telephone ?? "")}
              disabled={isPending}
              title="Modifier le téléphone"
              className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              type="tel"
              autoFocus
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePhone();
                if (e.key === "Escape") setEditPhone(null);
              }}
              disabled={isPending}
              aria-label={`Téléphone de ${utilisateur.nomComplet}`}
              placeholder="77 123 45 67"
              className="w-40 rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={handleSavePhone}
              disabled={isPending}
              title="Enregistrer"
              className="rounded-md p-1.5 text-green-600 hover:bg-green-50 disabled:opacity-40 dark:hover:bg-green-950"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setEditPhone(null)}
              disabled={isPending}
              title="Annuler"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <select
          aria-label={`Rôle de ${utilisateur.nomComplet}`}
          value={utilisateur.role}
          disabled={estSoiMeme || isPending}
          onChange={(e) => handleChangeRole(e.target.value as Role)}
          className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-800 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleToggleActif}
          disabled={estSoiMeme || isPending}
          title={utilisateur.actif ? "Désactiver" : "Activer"}
          className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 dark:hover:bg-zinc-800"
        >
          <Power className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={estSoiMeme || isPending}
          title="Supprimer"
          className="rounded-md p-2 text-red-500 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
