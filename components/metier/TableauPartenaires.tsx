"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, MessageCircle, Eye, Trash2 } from "lucide-react";
import {
  TYPE_PARTENAIRE_LABELS,
  type PartenaireListe,
} from "@/types/partenaire";
import { telHref, whatsappHref } from "@/lib/utils/format";
import { supprimerPartenaire } from "@/services/partenaires-actions";

/**
 * Liste des partenaires en lignes bordées (écran de pilotage). Un partenaire
 * inactif est grisé. La suppression logique (bouton corbeille) n'apparaît que
 * pour l'admin (`peutSupprimer`) ; le contrôle réel reste côté serveur.
 */
export default function TableauPartenaires({
  partenaires,
  peutSupprimer = false,
}: {
  partenaires: PartenaireListe[];
  peutSupprimer?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function supprimer(id: string, nom: string) {
    if (!window.confirm(`Supprimer le partenaire « ${nom} » ?`)) return;
    setErreur(null);
    startTransition(async () => {
      const res = await supprimerPartenaire(id);
      if (res.error) setErreur(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {erreur && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {erreur}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="px-3 py-2 font-medium">Nom</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Téléphone</th>
              <th className="px-3 py-2 font-medium">Commission</th>
              <th className="px-3 py-2 font-medium">Statut</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {partenaires.map((p) => (
              <tr
                key={p.id}
                className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                  p.actif
                    ? "text-zinc-700 dark:text-zinc-300"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                <td className="px-3 py-2">
                  <Link
                    href={`/partenaires/${p.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {p.nom}
                  </Link>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {TYPE_PARTENAIRE_LABELS[p.type]}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {p.telephone ?? "—"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {p.tauxCommissionDefaut !== null
                    ? `${p.tauxCommissionDefaut} %`
                    : "—"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {p.actif ? (
                    <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                      Actif
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      Inactif
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    {p.telephone && (
                      <>
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
                      </>
                    )}
                    <Link
                      href={`/partenaires/${p.id}`}
                      className="rounded-md p-2 text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
                      title="Voir le partenaire"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    {peutSupprimer && (
                      <button
                        type="button"
                        onClick={() => supprimer(p.id, p.nom)}
                        disabled={pending}
                        className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
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
