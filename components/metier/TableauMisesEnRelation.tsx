import Link from "next/link";
import { Eye } from "lucide-react";
import {
  SENS_MISE_EN_RELATION_LABELS,
  type MiseEnRelationListe,
} from "@/types/mise-en-relation";
import { TYPE_PARTENAIRE_LABELS } from "@/types/partenaire";
import { formatFcfa, formatDate } from "@/lib/utils/format";
import BadgeStatutMiseEnRelation from "./BadgeStatutMiseEnRelation";

/**
 * Liste des mises en relation en lignes bordées (écran de pilotage). Server
 * Component : purement présentation, aucune interaction (le suivi et les actions
 * sont sur la fiche détail).
 */
export default function TableauMisesEnRelation({
  misesEnRelation,
}: {
  misesEnRelation: MiseEnRelationListe[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="px-3 py-2 font-medium">Client</th>
            <th className="px-3 py-2 font-medium">Partenaire</th>
            <th className="px-3 py-2 font-medium">Statut</th>
            <th className="px-3 py-2 font-medium">Part M2S</th>
            <th className="px-3 py-2 font-medium">Encaissé</th>
            <th className="px-3 py-2 font-medium">Soumise le</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 text-zinc-700 dark:divide-zinc-800 dark:text-zinc-300">
          {misesEnRelation.map((m) => (
            <tr
              key={m.id}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <td className="px-3 py-2">
                <Link
                  href={`/mises-en-relation/${m.id}`}
                  className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                >
                  {m.clientNom || m.bienResume || "—"}
                </Link>
                <p className="text-xs text-zinc-400">
                  {SENS_MISE_EN_RELATION_LABELS[m.sens]}
                </p>
              </td>
              <td className="px-3 py-2">
                {m.partenaireNom}
                <p className="text-xs text-zinc-400">
                  {TYPE_PARTENAIRE_LABELS[m.partenaireType]}
                </p>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <BadgeStatutMiseEnRelation statut={m.statut} />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {m.partAgence !== null ? formatFcfa(m.partAgence) : "—"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {m.commissionPercue !== null ? (
                  <span className="font-medium text-green-700 dark:text-green-400">
                    {formatFcfa(m.commissionPercue)}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {formatDate(m.dateSoumission)}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center justify-end">
                  <Link
                    href={`/mises-en-relation/${m.id}`}
                    className="rounded-md p-2 text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
                    title="Voir le suivi"
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
  );
}
