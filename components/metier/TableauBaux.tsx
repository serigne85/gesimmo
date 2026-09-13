import Link from "next/link";
import { Phone, MessageCircle, Eye } from "lucide-react";
import { loyerTotal, type BailListe } from "@/types/bail";
import { formatDate, formatFcfa, telHref, whatsappHref } from "@/lib/utils/format";
import BadgeStatutBail from "./BadgeStatutBail";
import ActionsBailAdmin from "./ActionsBailAdmin";

/**
 * Liste des baux sous forme de tableau (écran de pilotage de la gestion
 * locative), sur le même modèle que TableauBiens / TableauDemandes. Le tableau
 * défile horizontalement sur mobile. Server Component : pas d'interactivité
 * au-delà des liens (appeler, WhatsApp, voir la fiche).
 *
 * Pas de sélection multiple ni de suppression ici : un bail se résilie/archive
 * via ses transitions de statut (fiche du bail), pas par une suppression en
 * masse — ses échéances et paiements en dépendent.
 */
export default function TableauBaux({
  baux,
  peutGerer = false,
}: {
  baux: BailListe[];
  peutGerer?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="px-3 py-2 font-medium">Locataire</th>
            <th className="px-3 py-2 font-medium">Téléphone</th>
            <th className="px-3 py-2 font-medium">Bien</th>
            <th className="px-3 py-2 font-medium">Début</th>
            <th className="px-3 py-2 font-medium">Fin</th>
            <th className="px-3 py-2 font-medium">Loyer</th>
            <th className="px-3 py-2 font-medium">Statut</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {baux.map((bail) => (
            <LigneBail key={bail.id} bail={bail} peutGerer={peutGerer} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LigneBail({ bail, peutGerer }: { bail: BailListe; peutGerer: boolean }) {
  return (
    <tr className="text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50">
      {/* Locataire (+ référence du bail) */}
      <td className="px-3 py-2">
        <Link
          href={`/gestion-locative/${bail.id}`}
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          {bail.locataireNom}
        </Link>
        <span className="block font-mono text-xs text-zinc-400">
          {bail.reference}
        </span>
      </td>

      <td className="px-3 py-2 whitespace-nowrap">
        {bail.locataireTelephone || "—"}
      </td>

      {/* Bien (référence + titre) */}
      <td className="px-3 py-2">
        <span className="block truncate">
          {bail.bienTitre || bail.bienReference}
        </span>
        {bail.bienTitre && (
          <span className="block font-mono text-xs text-zinc-400">
            {bail.bienReference}
          </span>
        )}
      </td>

      <td className="px-3 py-2 whitespace-nowrap">
        {bail.dateDebut ? formatDate(bail.dateDebut) : "—"}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {bail.dateFin ? formatDate(bail.dateFin) : "—"}
      </td>

      <td className="px-3 py-2 whitespace-nowrap">
        {formatFcfa(loyerTotal(bail.loyerMensuel, bail.chargesMensuelles))}
        <span className="text-xs font-normal text-zinc-400"> /mois</span>
      </td>

      <td className="px-3 py-2">
        <BadgeStatutBail statut={bail.statut} />
      </td>

      {/* Actions rapides */}
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1">
          {bail.locataireTelephone && (
            <>
              <a
                href={telHref(bail.locataireTelephone)}
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title={`Appeler ${bail.locataireTelephone}`}
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={whatsappHref(bail.locataireTelephone)}
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
            href={`/gestion-locative/${bail.id}`}
            className="rounded-md p-2 text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
            title="Voir la fiche"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Link>
          {peutGerer && (
            <ActionsBailAdmin bailId={bail.id} bailReference={bail.reference} />
          )}
        </div>
      </td>
    </tr>
  );
}
