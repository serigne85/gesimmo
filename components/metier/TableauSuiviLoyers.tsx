import Link from "next/link";
import { Phone, MessageCircle, Wallet } from "lucide-react";
import { resteEcheance } from "@/types/echeance";
import { formatFcfa, formatDate, telHref, whatsappHref } from "@/lib/utils/format";
import type { SuiviLigne } from "@/types/suivi";
import BadgeSituationEcheance from "./BadgeSituationEcheance";
import BoutonRelance from "./BoutonRelance";

/**
 * Suivi des loyers sous forme de tableau (écran de pilotage), sur le modèle de
 * TableauBaux. Chaque ligne mène à l'écran d'encaissement. Défile
 * horizontalement sur mobile. Le bouton « relancer » n'apparaît que sur les
 * retards. Server Component (les seuls éléments interactifs sont des liens et le
 * bouton de relance, lui-même client).
 */
export default function TableauSuiviLoyers({ lignes }: { lignes: SuiviLigne[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="px-3 py-2 font-medium">Locataire</th>
            <th className="px-3 py-2 font-medium">Bien</th>
            <th className="px-3 py-2 font-medium">Échéance</th>
            <th className="px-3 py-2 font-medium">Situation</th>
            <th className="px-3 py-2 text-right font-medium">Dû</th>
            <th className="px-3 py-2 text-right font-medium">Reste</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {lignes.map((ligne) => (
            <LigneSuivi key={ligne.echeanceId} ligne={ligne} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LigneSuivi({ ligne }: { ligne: SuiviLigne }) {
  const reste = resteEcheance(ligne.montantDu, ligne.montantRegle);

  return (
    <tr className="text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50">
      {/* Locataire (+ bail) */}
      <td className="px-3 py-2">
        <Link
          href={`/gestion-locative/echeance/${ligne.echeanceId}`}
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          {ligne.locataireNom}
        </Link>
        <span className="block font-mono text-xs text-zinc-400">
          {ligne.bailReference}
        </span>
      </td>

      {/* Bien */}
      <td className="px-3 py-2">
        <span className="block truncate">
          {ligne.bienTitre || ligne.bienReference}
        </span>
        {ligne.bienTitre && (
          <span className="block font-mono text-xs text-zinc-400">
            {ligne.bienReference}
          </span>
        )}
      </td>

      <td className="px-3 py-2 whitespace-nowrap">{formatDate(ligne.dateEcheance)}</td>

      <td className="px-3 py-2">
        <BadgeSituationEcheance situation={ligne.situation} />
      </td>

      <td className="px-3 py-2 text-right whitespace-nowrap">
        {formatFcfa(ligne.montantDu)}
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        {reste > 0 ? (
          <span className={ligne.situation === "en_retard" ? "text-red-600 dark:text-red-400" : ""}>
            {formatFcfa(reste)}
          </span>
        ) : (
          <span className="text-green-700 dark:text-green-400">Soldé</span>
        )}
      </td>

      {/* Actions rapides */}
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1">
          {ligne.situation === "en_retard" && (
            <BoutonRelance
              echeanceId={ligne.echeanceId}
              derniereRelanceLe={ligne.derniereRelanceLe}
            />
          )}
          {ligne.locataireTelephone && (
            <>
              <a
                href={telHref(ligne.locataireTelephone)}
                title="Appeler le locataire"
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-blue-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={whatsappHref(ligne.locataireTelephone)}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="rounded-md p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </a>
            </>
          )}
          <Link
            href={`/gestion-locative/echeance/${ligne.echeanceId}`}
            title="Encaisser"
            className="rounded-md p-2 text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
