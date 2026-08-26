"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, MessageCircle, Pencil, Trash2, Building2 } from "lucide-react";
import type { ProspectionListe } from "@/types/prospection";
import { formatDate, telHref, whatsappHref } from "@/lib/utils/format";
import { supprimerProspections } from "@/services/prospections-actions";
import BadgeStatutProspection from "./BadgeStatutProspection";

/**
 * Liste des prospections terrain (écran de pilotage). Le nom du propriétaire et
 * son téléphone sont sur deux colonnes distinctes. Les relances dépassées
 * (rouge) ou à venir (ambre) sont mises en avant. Si `peutSupprimer`, des cases
 * à cocher et une suppression logique apparaissent. `aujourdhui` vient du
 * serveur pour éviter tout décalage d'hydratation.
 */
export default function TableauProspections({
  prospections,
  aujourdhui,
  peutSupprimer = false,
}: {
  prospections: ProspectionListe[];
  aujourdhui: string;
  peutSupprimer?: boolean;
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const tousSelectionnes =
    prospections.length > 0 && selection.size === prospections.length;

  function classeRelance(statut: string, date: string | null): string {
    if (statut !== "a_relancer" || !date) return "text-zinc-400";
    if (date < aujourdhui) return "font-medium text-red-700 dark:text-red-400";
    return "font-medium text-amber-700 dark:text-amber-500";
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
      tousSelectionnes ? new Set() : new Set(prospections.map((p) => p.id))
    );
  }

  function supprimer() {
    if (selection.size === 0) return;
    if (
      !window.confirm(
        `Supprimer ${selection.size} prospection${selection.size > 1 ? "s" : ""} ?`
      )
    )
      return;
    setErreur(null);
    startTransition(async () => {
      const res = await supprimerProspections(Array.from(selection));
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
            {pending ? "Suppression…" : `Supprimer (${selection.size})`}
          </button>
          {erreur && (
            <span role="alert" className="text-sm text-red-600 dark:text-red-400">
              {erreur}
            </span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[860px] text-sm">
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
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Propriétaire</th>
              <th className="px-3 py-2 font-medium">Téléphone</th>
              <th className="px-3 py-2 font-medium">Zone</th>
              <th className="px-3 py-2 font-medium">Produit</th>
              <th className="px-3 py-2 font-medium">Statut</th>
              <th className="px-3 py-2 font-medium">Relance</th>
              <th className="px-3 py-2 font-medium">Responsable</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {prospections.map((p) => (
              <tr
                key={p.id}
                className="text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
              >
                {peutSupprimer && (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selection.has(p.id)}
                      onChange={() => basculer(p.id)}
                      aria-label={`Sélectionner ${p.nomComplet}`}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-900 focus:ring-blue-600"
                    />
                  </td>
                )}
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatDate(p.dateProspection)}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/prospects/${p.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {p.nomComplet || "—"}
                  </Link>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{p.telephone}</td>
                <td className="px-3 py-2">{p.zoneNom ?? "—"}</td>
                <td className="px-3 py-2">{p.produit ?? "—"}</td>
                <td className="px-3 py-2">
                  <BadgeStatutProspection statut={p.statut} />
                </td>
                <td
                  className={`px-3 py-2 whitespace-nowrap ${classeRelance(p.statut, p.dateRelance)}`}
                >
                  {p.statut === "a_relancer" && p.dateRelance
                    ? formatDate(p.dateRelance)
                    : "—"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{p.agentNom ?? "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={telHref(p.telephone)}
                      className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title={`Appeler ${p.telephone}`}
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <a
                      href={whatsappHref(p.telephone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    </a>
                    {p.statut === "disponible" && (
                      <Link
                        href={`/biens/nouveau?prospection=${p.id}`}
                        className="rounded-md p-2 text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
                        title="Ajouter aux biens"
                      >
                        <Building2 className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    )}
                    <Link
                      href={`/prospects/${p.id}`}
                      className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
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
