import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import {
  TYPE_BIEN_LABELS,
  OBJECTIF_LABELS,
  type BienListe,
} from "@/types/bien";
import { formatFcfa, telHref, whatsappHref } from "@/lib/utils/format";
import BadgeStatutBien from "./BadgeStatutBien";

/**
 * Une ligne de la liste des biens. Server Component : pas d'interactivité,
 * les actions rapides sont de simples liens (tel: et wa.me).
 */
export default function LigneBien({ bien }: { bien: BienListe }) {
  const lieu = [bien.zoneNom, bien.villeNom].filter(Boolean).join(", ");

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href={`/biens/${bien.id}`}
        className="min-w-0 rounded-md hover:opacity-80"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {bien.reference}
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {TYPE_BIEN_LABELS[bien.type]}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            · {OBJECTIF_LABELS[bien.objectif]}
          </span>
          <BadgeStatutBien statut={bien.statut} />
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
          {lieu || "Zone non précisée"} · {bien.proprietaireNom}
          {bien.prix !== null && ` · ${formatFcfa(bien.prix)}`}
        </p>
      </Link>

      {/* Actions rapides : appeler / WhatsApp le propriétaire */}
      <div className="flex items-center gap-2">
        <a
          href={telHref(bien.proprietaireTelephone)}
          className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title={`Appeler ${bien.proprietaireTelephone}`}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
        </a>
        <a
          href={whatsappHref(bien.proprietaireTelephone)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
          title="WhatsApp"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </li>
  );
}
