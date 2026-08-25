import Link from "next/link";
import { MapPin, Ruler, BedDouble, House } from "lucide-react";
import { formatFcfa } from "@/lib/utils/format";
import { TYPE_BIEN_LABELS } from "@/types/bien";
import type { BienVitrine } from "@/services/vitrine";

/**
 * Carte d'un bien sur le site vitrine. Contrairement aux lignes bordées de
 * l'ERP, ici on met en valeur : grande photo, prix lisible, quartier. Toute la
 * carte est un lien vers la fiche détail (construite à l'étape 3).
 *
 * Server Component : aucune interactivité, juste de l'affichage.
 */
export default function CarteBienVitrine({ bien }: { bien: BienVitrine }) {
  // Location = loyer mensuel ; vente = prix ferme. « Prix sur demande » si absent.
  const prix =
    bien.prix === null
      ? "Prix sur demande"
      : bien.objectif === "location"
        ? `${formatFcfa(bien.prix)} / mois`
        : formatFcfa(bien.prix);

  const objectifLabel = bien.objectif === "location" ? "À louer" : "À vendre";
  const objectifClasse =
    bien.objectif === "location" ? "bg-terracotta-500" : "bg-bleu-profond";

  const lieu = [bien.villeNom, bien.zoneNom].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/nos-biens/${bien.id}`}
      className="group block overflow-hidden rounded-2xl bg-sable-50 ring-1 ring-sable-200 transition hover:shadow-lg hover:shadow-stone-900/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sable-100">
        {bien.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URLs signées Supabase (bucket privé) : <img> + lazy loading, pas next/image.
          <img
            src={bien.photoUrl}
            alt={bien.titre ?? TYPE_BIEN_LABELS[bien.type]}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sable-200">
            <House className="h-12 w-12" aria-hidden="true" />
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white ${objectifClasse}`}
        >
          {objectifLabel}
        </span>
      </div>

      <div className="p-4">
        <p className="font-display text-lg font-semibold text-stone-900">{prix}</p>
        <h3 className="mt-1 truncate font-medium text-stone-800">
          {bien.titre ?? TYPE_BIEN_LABELS[bien.type]}
        </h3>
        {lieu && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{lieu}</span>
          </p>
        )}

        <div className="mt-3 flex items-center gap-4 border-t border-sable-200 pt-3 text-xs text-stone-500">
          <span className="rounded-md bg-sable-100 px-2 py-0.5 font-medium text-stone-600">
            {TYPE_BIEN_LABELS[bien.type]}
          </span>
          {bien.surface !== null && (
            <span className="inline-flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" aria-hidden="true" /> {bien.surface} m²
            </span>
          )}
          {bien.nombreChambres !== null && (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />{" "}
              {bien.nombreChambres} ch.
            </span>
          )}
          <span className="ml-auto font-mono text-stone-400">{bien.reference}</span>
        </div>
      </div>
    </Link>
  );
}
