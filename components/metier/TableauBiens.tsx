import Link from "next/link";
import { Phone, MessageCircle, Eye, Tag, KeyRound, ImageOff } from "lucide-react";
import {
  TYPE_BIEN_LABELS,
  OBJECTIF_LABELS,
  type BienListe,
} from "@/types/bien";
import { formatFcfa, telHref, whatsappHref } from "@/lib/utils/format";
import BadgeStatutBien from "./BadgeStatutBien";

/**
 * Liste des biens sous forme de tableau (écran de pilotage du portefeuille).
 * Server Component : pas d'interactivité, les actions rapides sont de simples
 * liens (tel:, wa.me, fiche). Le tableau défile horizontalement sur mobile.
 */
export default function TableauBiens({ biens }: { biens: BienListe[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="px-3 py-2 font-medium">Photo</th>
            <th className="px-3 py-2 font-medium">Objectif</th>
            <th className="px-3 py-2 font-medium">Titre</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Zone</th>
            <th className="px-3 py-2 font-medium">Prix</th>
            <th className="px-3 py-2 font-medium">Cycle de vie</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {biens.map((bien) => (
            <LigneBien key={bien.id} bien={bien} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LigneBien({ bien }: { bien: BienListe }) {
  const lieu = [bien.zoneNom, bien.villeNom].filter(Boolean).join(", ");

  return (
    <tr className="text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50">
      {/* Photo principale */}
      <td className="px-3 py-2">
        <div className="h-11 w-11 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
          {bien.photoPrincipaleUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bien.photoPrincipaleUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <ImageOff className="h-4 w-4" aria-hidden="true" />
            </div>
          )}
        </div>
      </td>

      {/* Objectif (vignette icône + libellé) */}
      <td className="px-3 py-2">
        <VignetteObjectif objectif={bien.objectif} />
      </td>

      {/* Titre (+ référence) */}
      <td className="px-3 py-2">
        <Link
          href={`/biens/${bien.id}`}
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          {bien.titre || TYPE_BIEN_LABELS[bien.type]}
        </Link>
        <span className="block font-mono text-xs text-zinc-400">
          {bien.reference}
        </span>
      </td>

      <td className="px-3 py-2 whitespace-nowrap">{TYPE_BIEN_LABELS[bien.type]}</td>
      <td className="px-3 py-2">{lieu || "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap">{formatFcfa(bien.prix)}</td>
      <td className="px-3 py-2">
        <BadgeStatutBien statut={bien.statut} />
      </td>

      {/* Actions rapides */}
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1">
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
          <Link
            href={`/biens/${bien.id}`}
            className="rounded-md p-2 text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
            title="Voir la fiche"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

/** Vignette de l'objectif : icône + libellé, avec une couleur distincte par
 *  objectif. Teintes choisies HORS du code couleur des statuts (vert/ambre/
 *  rouge/gris/bleu) : beige = vente, sarcelle = location. Beige n'existe pas
 *  dans la palette Tailwind : on le pose en valeur explicite. */
const OBJECTIF_COULEURS: Record<BienListe["objectif"], string> = {
  vente:
    "bg-[#f5efdf] text-[#7a6a3a] dark:bg-[#3a3320] dark:text-[#e6dcc0]",
  location:
    "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
};

function VignetteObjectif({ objectif }: { objectif: BienListe["objectif"] }) {
  const Icone = objectif === "vente" ? Tag : KeyRound;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${OBJECTIF_COULEURS[objectif]}`}
    >
      <Icone className="h-3.5 w-3.5" aria-hidden="true" />
      {OBJECTIF_LABELS[objectif]}
    </span>
  );
}
