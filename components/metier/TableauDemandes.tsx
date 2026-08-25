"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, MessageCircle, Eye, Trash2 } from "lucide-react";
import {
  OBJECTIF_DEMANDE_LABELS,
  type DemandeListe,
} from "@/types/demande";
import { TYPE_BIEN_LABELS } from "@/types/bien";
import { formatDate, telHref, whatsappHref } from "@/lib/utils/format";
import { supprimerDemandes } from "@/services/demandes-actions";

/** Ajoute des jours à une date « AAAA-MM-JJ » (calcul en UTC). */
function ajouterJours(iso: string, jours: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

/**
 * Liste des demandes clients sous forme de tableau (écran de pilotage). Les
 * échéances dépassées (rouge) ou proches (≤ 7 jours, ambre) sont mises en avant
 * pour traiter par priorité. Si `peutSupprimer` (admin), des cases à cocher et
 * un bouton de suppression logique apparaissent. `aujourdhui` vient du serveur
 * pour éviter tout décalage d'hydratation.
 */
export default function TableauDemandes({
  demandes,
  aujourdhui,
  peutSupprimer = false,
}: {
  demandes: DemandeListe[];
  aujourdhui: string;
  peutSupprimer?: boolean;
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const dansSeptJours = ajouterJours(aujourdhui, 7);
  const tousSelectionnes =
    demandes.length > 0 && selection.size === demandes.length;

  function classeEcheance(date: string | null): string {
    if (!date) return "text-zinc-400";
    if (date < aujourdhui) return "font-medium text-red-700 dark:text-red-400";
    if (date <= dansSeptJours)
      return "font-medium text-amber-700 dark:text-amber-500";
    return "text-zinc-700 dark:text-zinc-300";
  }

  function basculer(id: string) {
    setSelection((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });
  }

  function basculerTous() {
    setSelection(
      tousSelectionnes ? new Set() : new Set(demandes.map((d) => d.id))
    );
  }

  function supprimer() {
    if (selection.size === 0) return;
    if (
      !window.confirm(
        `Supprimer ${selection.size} demande${selection.size > 1 ? "s" : ""} ?`
      )
    )
      return;
    setErreur(null);
    startTransition(async () => {
      const res = await supprimerDemandes(Array.from(selection));
      if (res.error) setErreur(res.error);
      else {
        setSelection(new Set());
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {peutSupprimer && selection.size > 0 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={supprimer}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {pending
              ? "Suppression…"
              : `Supprimer (${selection.size})`}
          </button>
          {erreur && (
            <span role="alert" className="text-sm text-red-600 dark:text-red-400">
              {erreur}
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              {peutSupprimer && (
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={tousSelectionnes}
                    onChange={basculerTous}
                    aria-label="Tout sélectionner"
                    className="h-4 w-4 rounded border-zinc-300 text-blue-900 focus:ring-blue-600"
                  />
                </th>
              )}
              <th className="px-3 py-2 font-medium">Nom</th>
              <th className="px-3 py-2 font-medium">Téléphone</th>
              <th className="px-3 py-2 font-medium">Type de bien</th>
              <th className="px-3 py-2 font-medium">Objectif</th>
              <th className="px-3 py-2 font-medium">Date demande</th>
              <th className="px-3 py-2 font-medium">Échéance</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {demandes.map((d) => (
              <tr
                key={d.id}
                className="text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
              >
                {peutSupprimer && (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selection.has(d.id)}
                      onChange={() => basculer(d.id)}
                      aria-label={`Sélectionner ${d.clientNom}`}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-900 focus:ring-blue-600"
                    />
                  </td>
                )}
                <td className="px-3 py-2">
                  <Link
                    href={`/demandes/${d.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {d.clientNom || "—"}
                  </Link>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{d.clientTelephone}</td>
                <td className="px-3 py-2">
                  {d.types.length > 0
                    ? d.types.map((t) => TYPE_BIEN_LABELS[t]).join(", ")
                    : "Tous"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {OBJECTIF_DEMANDE_LABELS[d.objectif]}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatDate(d.dateDemande)}
                </td>
                <td className={`px-3 py-2 whitespace-nowrap ${classeEcheance(d.dateEcheance)}`}>
                  {d.dateEcheance ? formatDate(d.dateEcheance) : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={telHref(d.clientTelephone)}
                      className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title={`Appeler ${d.clientTelephone}`}
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <a
                      href={whatsappHref(d.clientTelephone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <Link
                      href={`/demandes/${d.id}`}
                      className="rounded-md p-2 text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
                      title="Voir la demande"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
