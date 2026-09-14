"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Pipeline } from "@/types/opportunite";
import type { BienOption } from "@/services/biens";
import type { ContactOption } from "@/services/contacts";
import type { UtilisateurOption } from "@/services/utilisateurs";
import { TYPE_BIEN_LABELS } from "@/types/bien";
import {
  creerOpportunite,
  type CreerOpportuniteState,
} from "@/services/opportunites-actions";
import { champClasse, labelClasse } from "./champsBien";

const initialState: CreerOpportuniteState = { error: null };

/**
 * Formulaire de création d'une opportunité. Seuls le titre et le pipeline sont
 * obligatoires ; l'opportunité démarrera à la première étape du pipeline. Les
 * liens (bien, contact, demande) sont optionnels. Les valeurs `prefill*`
 * permettront plus tard de lancer une opportunité depuis une demande ou un bien.
 */
export default function FormulaireOpportunite({
  pipelines,
  biens,
  contacts,
  responsables,
  prefillTitre,
  prefillBienId,
  prefillContactId,
  prefillDemandeId,
}: {
  pipelines: Pipeline[];
  biens: BienOption[];
  contacts: ContactOption[];
  responsables: UtilisateurOption[];
  prefillTitre?: string;
  prefillBienId?: string;
  prefillContactId?: string;
  prefillDemandeId?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    creerOpportunite,
    initialState
  );

  if (pipelines.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Aucun pipeline actif. Les pipelines par défaut seront créés au premier
        chargement de la page Opportunités.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {prefillDemandeId && (
        <input type="hidden" name="demandeId" value={prefillDemandeId} />
      )}

      {/* Titre */}
      <div>
        <label htmlFor="titre" className={labelClasse}>
          Titre de l&apos;opportunité
        </label>
        <input
          id="titre"
          name="titre"
          type="text"
          required
          defaultValue={prefillTitre ?? ""}
          placeholder="Ex. Vente villa Ngor à M. Diop"
          className={champClasse}
        />
      </div>

      {/* Pipeline */}
      <div>
        <label htmlFor="pipelineId" className={labelClasse}>
          Pipeline
        </label>
        <select
          id="pipelineId"
          name="pipelineId"
          required
          defaultValue={pipelines[0]?.id ?? ""}
          className={champClasse}
        >
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          L&apos;opportunité démarrera à la première étape du pipeline choisi.
        </p>
      </div>

      {/* Montant estimé */}
      <div>
        <label htmlFor="montantEstime" className={labelClasse}>
          Montant estimé (FCFA){" "}
          <span className="text-zinc-400">(optionnel)</span>
        </label>
        <input
          id="montantEstime"
          name="montantEstime"
          type="number"
          min="0"
          step="1"
          className={champClasse}
        />
      </div>

      {/* Contact intéressé */}
      <div>
        <label htmlFor="contactId" className={labelClasse}>
          Contact <span className="text-zinc-400">(optionnel)</span>
        </label>
        <select
          id="contactId"
          name="contactId"
          defaultValue={prefillContactId ?? ""}
          className={champClasse}
        >
          <option value="">— Aucun —</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nomComplet} · {c.telephone}
            </option>
          ))}
        </select>
      </div>

      {/* Bien concerné */}
      <div>
        <label htmlFor="bienId" className={labelClasse}>
          Bien concerné <span className="text-zinc-400">(optionnel)</span>
        </label>
        <select
          id="bienId"
          name="bienId"
          defaultValue={prefillBienId ?? ""}
          className={champClasse}
        >
          <option value="">— Aucun —</option>
          {biens.map((b) => (
            <option key={b.id} value={b.id}>
              {b.reference}
              {b.titre ? ` · ${b.titre}` : ` · ${TYPE_BIEN_LABELS[b.type]}`}
            </option>
          ))}
        </select>
      </div>

      {/* Responsable */}
      <div>
        <label htmlFor="responsableId" className={labelClasse}>
          Responsable <span className="text-zinc-400">(optionnel)</span>
        </label>
        <select
          id="responsableId"
          name="responsableId"
          defaultValue=""
          className={champClasse}
        >
          <option value="">— Moi —</option>
          {responsables.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nomComplet}
            </option>
          ))}
        </select>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
        >
          {isPending ? "Enregistrement…" : "Créer l'opportunité"}
        </button>
        <Link
          href="/opportunites"
          className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
