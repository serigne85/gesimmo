import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { resteEcheance } from "@/types/echeance";
import { formatFcfa, telHref, whatsappHref } from "@/lib/utils/format";
import type { SuiviLigne } from "@/types/suivi";
import BadgeSituationEcheance from "./BadgeSituationEcheance";
import BoutonRelance from "./BoutonRelance";

/**
 * Une ligne du suivi des loyers. Le bloc de gauche mène à l'encaissement ; les
 * actions rapides (appeler, WhatsApp, relancer) restent à part pour ne pas
 * imbriquer d'ancres. Le bouton « relancer » n'apparaît que sur les retards.
 */
export default function LigneSuiviLoyer({ ligne }: { ligne: SuiviLigne }) {
  const reste = resteEcheance(ligne.montantDu, ligne.montantRegle);

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href={`/gestion-locative/echeance/${ligne.echeanceId}`}
        className="min-w-0 sm:flex-1"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {ligne.locataireNom}
          </span>
          <BadgeSituationEcheance situation={ligne.situation} />
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
          {ligne.bienReference}
          {ligne.bienTitre ? ` · ${ligne.bienTitre}` : ""} · {ligne.bailReference}
        </p>
      </Link>

      <div className="flex items-center gap-3 sm:justify-end">
        <div className="text-sm sm:text-right">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">
            {formatFcfa(ligne.montantDu)}
          </p>
          {reste > 0 && reste !== ligne.montantDu && (
            <p className="text-xs text-red-600 dark:text-red-400">
              reste {formatFcfa(reste)}
            </p>
          )}
        </div>

        {ligne.locataireTelephone && (
          <div className="flex items-center gap-1">
            <a
              href={telHref(ligne.locataireTelephone)}
              title="Appeler le locataire"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={whatsappHref(ligne.locataireTelephone)}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-green-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        )}

        {ligne.situation === "en_retard" && (
          <BoutonRelance
            echeanceId={ligne.echeanceId}
            derniereRelanceLe={ligne.derniereRelanceLe}
          />
        )}
      </div>
    </li>
  );
}
