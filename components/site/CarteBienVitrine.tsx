import Link from "next/link";
import { MapPin, Ruler, BedDouble, House } from "lucide-react";
import { formatFcfa } from "@/lib/utils/format";
import { TYPE_BIEN_LABELS } from "@/types/bien";
import type { BienVitrine } from "@/services/vitrine";

/**
 * Carte d'un bien sur le site vitrine. Contrairement aux lignes bordées de
 * l'ERP, ici on met en valeur : grande photo, prix lisible, quartier. Toute la
 * carte est un lien vers la fiche détail.
 *
 * Server Component : aucune interactivité, juste de l'affichage.
 */
export default function CarteBienVitrine({ bien }: { bien: BienVitrine }) {
  const enLocation = bien.objectif === "location";

  const objectifLabel = enLocation ? "À louer" : "À vendre";
  const objectifClasse = enLocation ? "bg-orange" : "bg-marine";

  const lieu = [bien.villeNom, bien.zoneNom].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/nos-biens/${bien.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-craie-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-marine-950/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-craie-100">
        {bien.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URLs signées Supabase (bucket privé) : <img> + lazy loading, pas next/image.
          <img
            src={bien.photoUrl}
            alt={bien.titre ?? TYPE_BIEN_LABELS[bien.type]}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-craie-200">
            <House className="h-12 w-12" aria-hidden="true" />
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${objectifClasse}`}
        >
          {objectifLabel}
        </span>
        <span className="absolute right-3 top-3 max-w-[60%] truncate rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
          {bien.titre ?? TYPE_BIEN_LABELS[bien.type]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-display text-xl font-bold text-marine">
          {bien.prix === null ? (
            "Prix sur demande"
          ) : (
            <>
              {formatFcfa(bien.prix)}
              {enLocation && (
                <span className="text-sm font-medium text-slate-400"> / mois</span>
              )}
            </>
          )}
        </p>
        <h3 className="mt-1.5 truncate font-semibold text-slate-800">
          {bien.titre ?? TYPE_BIEN_LABELS[bien.type]}
        </h3>
        {lieu && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-4 w-4 shrink-0 text-marine" aria-hidden="true" />
            <span className="truncate">{lieu}</span>
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-craie-200 pt-4 text-xs text-slate-500">
          {bien.surface !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-craie-100 px-2.5 py-1 font-medium text-slate-600">
              <Ruler className="h-3.5 w-3.5" aria-hidden="true" /> {bien.surface} m²
            </span>
          )}
          {bien.nombreChambres !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-craie-100 px-2.5 py-1 font-medium text-slate-600">
              <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />{" "}
              {bien.nombreChambres} ch.
            </span>
          )}
          <span className="ml-auto font-mono text-slate-400">{bien.reference}</span>
        </div>
      </div>
    </Link>
  );
}
