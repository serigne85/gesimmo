import { Search } from "lucide-react";
import { TYPES_BIEN, TYPE_BIEN_LABELS } from "@/types/bien";
import type { ZoneVitrineOption } from "@/services/vitrine";

/**
 * Barre de recherche du hero. Volontairement SANS interactivité JavaScript :
 * c'est un simple formulaire HTML `method="get"` qui pointe vers /nos-biens.
 * Au clic sur « Rechercher », le navigateur construit lui-même l'URL
 * /nos-biens?objectif=…&type=…&zone=… — exactement les paramètres que la page
 * liste sait déjà lire et filtrer côté serveur. Aucune logique nouvelle : on
 * réutilise à 100 % le filtrage existant. Reste donc un Server Component.
 */
export default function RechercheHero({
  zones,
}: {
  zones: ZoneVitrineOption[];
}) {
  const champClasse =
    "h-12 w-full rounded-xl border border-craie-200 bg-craie-50 px-3 text-sm font-medium text-slate-700 transition-colors focus:border-marine focus:outline-none focus:ring-2 focus:ring-marine/30";

  return (
    <form
      action="/nos-biens"
      method="get"
      className="grid gap-3 rounded-2xl bg-white p-3 shadow-xl shadow-marine-950/20 ring-1 ring-craie-200 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
    >
      <label className="sr-only" htmlFor="q-objectif">
        Objectif
      </label>
      <select id="q-objectif" name="objectif" defaultValue="" className={champClasse}>
        <option value="">À vendre ou à louer</option>
        <option value="vente">À vendre</option>
        <option value="location">À louer</option>
      </select>

      <label className="sr-only" htmlFor="q-type">
        Type de bien
      </label>
      <select id="q-type" name="type" defaultValue="" className={champClasse}>
        <option value="">Tous les types</option>
        {TYPES_BIEN.map((t) => (
          <option key={t} value={t}>
            {TYPE_BIEN_LABELS[t]}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="q-zone">
        Zone
      </label>
      <select id="q-zone" name="zone" defaultValue="" className={champClasse}>
        <option value="">Toutes les zones</option>
        {zones.map((z) => (
          <option key={z.id} value={z.id}>
            {z.villeNom ? `${z.nom} · ${z.villeNom}` : z.nom}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange px-6 text-sm font-semibold text-white transition-colors hover:bg-orange-hover"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Rechercher
      </button>
    </form>
  );
}
