import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  House,
  Building2,
  Store,
  Trees,
  Warehouse,
  Briefcase,
} from "lucide-react";
import { AGENCE } from "@/lib/site/config";
import { listBiensVitrine, listZonesVitrine } from "@/services/vitrine";
import CarteBienVitrine from "@/components/site/CarteBienVitrine";
import RechercheHero from "@/components/site/RechercheHero";
import SectionApropos from "@/components/site/SectionApropos";
import SectionServices from "@/components/site/SectionServices";
import SectionPourquoi from "@/components/site/SectionPourquoi";

/** Raccourcis « explorer par type » affichés sur l'accueil (sous-ensemble choisi). */
const CATEGORIES = [
  { type: "villa", label: "Villas", icon: House },
  { type: "appartement", label: "Appartements", icon: Building2 },
  { type: "terrain", label: "Terrains", icon: Trees },
  { type: "bureau", label: "Bureaux", icon: Briefcase },
  { type: "commerce", label: "Commerces", icon: Store },
  { type: "immeuble", label: "Immeubles", icon: Warehouse },
] as const;

/**
 * Page d'accueil du site vitrine : hero avec barre de recherche, exploration
 * par type, aperçu des derniers biens disponibles, promesses et appel à l'action.
 */
export default async function AccueilVitrine() {
  const [{ rows: biens, total }, zones] = await Promise.all([
    listBiensVitrine(1),
    listZonesVitrine(),
  ]);
  const apercu = biens.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-marine-950">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-orange/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-marine/40 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-craie-100 ring-1 ring-white/15">
            <MapPin className="h-4 w-4" aria-hidden="true" /> Dakar, Sénégal
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Trouvez le bien qui vous ressemble, en toute confiance
          </h1>
          <p className="mt-5 max-w-xl text-lg text-craie-200/80">
            {AGENCE.nom} vous accompagne dans la vente, la location et la gérance
            de biens immobiliers à Dakar.
          </p>

          <div className="mt-10 max-w-4xl">
            <RechercheHero zones={zones} />
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4">
            <div>
              <dt className="text-sm text-craie-200/60">Biens disponibles</dt>
              <dd className="font-display text-2xl font-bold text-white">{total}</dd>
            </div>
            <div>
              <dt className="text-sm text-craie-200/60">Zones couvertes</dt>
              <dd className="font-display text-2xl font-bold text-white">
                {zones.length}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-craie-200/60">Nos métiers</dt>
              <dd className="font-display text-2xl font-bold text-white">
                Vente · Location · Gérance
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Explorer par type */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Explorer par type de bien
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <li key={cat.type}>
              <Link
                href={`/nos-biens?type=${cat.type}`}
                className="group flex flex-col items-center gap-3 rounded-2xl bg-craie-50 p-6 text-center ring-1 ring-craie-200 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-marine-950/5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-marine/10 text-marine transition-colors group-hover:bg-marine group-hover:text-white">
                  <cat.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {cat.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* À propos de l'agence */}
      <SectionApropos />

      {/* Nos services */}
      <SectionServices />

      {/* Aperçu des biens */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Nos biens disponibles
          </h2>
          <Link
            href="/nos-biens"
            className="inline-flex items-center gap-1 text-sm font-semibold text-marine hover:text-marine-hover"
          >
            Tout voir <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {apercu.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-craie-200 bg-craie-100/50 p-10 text-center text-sm text-slate-500">
            Aucun bien disponible pour le moment. Revenez bientôt.
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {apercu.map((bien) => (
              <li key={bien.id}>
                <CarteBienVitrine bien={bien} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pourquoi nous choisir */}
      <SectionPourquoi />

      {/* Appel à l'action */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-marine px-8 py-14 text-center sm:px-12">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-orange/25 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Un projet immobilier à Dakar ?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-craie-200/80">
              Parlons-en. Nos agents vous répondent et vous accompagnent à chaque
              étape.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/nos-biens"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-marine transition-colors hover:bg-craie-100"
              >
                Voir nos biens <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-hover"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
