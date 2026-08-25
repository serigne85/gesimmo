import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import {
  OBJECTIF_DEMANDE_LABELS,
  type DemandeListe,
} from "@/types/demande";
import { TYPE_BIEN_LABELS } from "@/types/bien";
import { formatFcfa, telHref, whatsappHref } from "@/lib/utils/format";
import BadgeStatutDemande from "./BadgeStatutDemande";

/** Fourchette de budget lisible à partir du min/max. */
function formatBudget(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${formatFcfa(min)} – ${formatFcfa(max)}`;
  if (max !== null) return `≤ ${formatFcfa(max)}`;
  if (min !== null) return `≥ ${formatFcfa(min)}`;
  return "Budget non précisé";
}

/**
 * Une ligne de la liste des demandes. Server Component : actions rapides
 * (appeler / WhatsApp le client) en simples liens.
 */
export default function LigneDemande({ demande }: { demande: DemandeListe }) {
  const types = demande.types.map((t) => TYPE_BIEN_LABELS[t]).join(", ");
  const zones = demande.zones.join(", ");

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <Link href={`/demandes/${demande.id}`} className="min-w-0 rounded-md hover:opacity-80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {demande.clientNom || "—"}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            · {OBJECTIF_DEMANDE_LABELS[demande.objectif]}
          </span>
          <BadgeStatutDemande statut={demande.statut} />
        </div>
        <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
          {formatBudget(demande.budgetMin, demande.budgetMax)}
          {types && ` · ${types}`}
          {zones && ` · ${zones}`}
        </p>
      </Link>

      {/* Actions rapides : appeler / WhatsApp le client */}
      <div className="flex items-center gap-2">
        <a
          href={telHref(demande.clientTelephone)}
          className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title={`Appeler ${demande.clientTelephone}`}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
        </a>
        <a
          href={whatsappHref(demande.clientTelephone)}
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
