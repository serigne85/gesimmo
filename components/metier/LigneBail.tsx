import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { loyerTotal, type BailListe } from "@/types/bail";
import { formatDate, formatFcfa, telHref, whatsappHref } from "@/lib/utils/format";
import BadgeStatutBail from "./BadgeStatutBail";

/**
 * Une ligne de la liste des baux. Le bloc de gauche mène à la fiche ; les
 * actions rapides (appeler, WhatsApp) restent des liens à part pour ne pas
 * imbriquer d'ancres (HTML invalide).
 */
export default function LigneBail({ bail }: { bail: BailListe }) {
  const periode = [bail.dateDebut, bail.dateFin]
    .map((d) => (d ? formatDate(d) : null))
    .filter(Boolean)
    .join(" → ");

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <Link href={`/gestion-locative/${bail.id}`} className="min-w-0 sm:flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {bail.reference}
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {bail.locataireNom}
          </span>
          <BadgeStatutBail statut={bail.statut} />
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
          {bail.bienReference}
          {bail.bienTitre ? ` · ${bail.bienTitre}` : ""}
          {periode ? ` · ${periode}` : ""}
        </p>
      </Link>

      <div className="flex items-center gap-3 sm:justify-end">
        <div className="text-sm text-zinc-700 sm:text-right dark:text-zinc-300">
          <p className="font-medium">
            {formatFcfa(loyerTotal(bail.loyerMensuel, bail.chargesMensuelles))}
            <span className="text-xs font-normal text-zinc-400"> /mois</span>
          </p>
        </div>
        {bail.locataireTelephone && (
          <div className="flex items-center gap-1">
            <a
              href={telHref(bail.locataireTelephone)}
              title="Appeler le locataire"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={whatsappHref(bail.locataireTelephone)}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-green-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </li>
  );
}
