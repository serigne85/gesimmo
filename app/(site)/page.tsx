import Link from "next/link";
import { ArrowRight, ShieldCheck, MapPin, House } from "lucide-react";
import { AGENCE } from "@/lib/site/config";
import { listBiensVitrine } from "@/services/vitrine";
import CarteBienVitrine from "@/components/site/CarteBienVitrine";

/**
 * Page d'accueil du site vitrine : hero + trois promesses + un aperçu des
 * derniers biens disponibles (les 3 plus récents), avec un lien vers la liste
 * complète.
 */
export default async function AccueilVitrine() {
  const { rows: biens } = await listBiensVitrine(1);
  const apercu = biens.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-terracotta-500/10 px-3 py-1 text-sm font-medium text-terracotta-600">
              <MapPin className="h-4 w-4" aria-hidden="true" /> Dakar, Sénégal
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl">
              Trouvez le bien qui vous ressemble, en toute confiance
            </h1>
            <p className="mt-5 max-w-md text-lg text-stone-600">
              {AGENCE.nom} vous accompagne dans la vente, la location et la
              gérance de biens immobiliers à Dakar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/nos-biens"
                className="inline-flex items-center gap-2 rounded-full bg-bleu-profond px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-bleu-profond-hover"
              >
                Voir nos biens <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-sable-100"
              >
                Nous contacter
              </Link>
            </div>
          </div>

          {/* Placeholder visuel — remplacé par une vraie photo à l'étape 2. */}
          <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-terracotta-500/20 via-sable-200 to-bleu-profond/15 ring-1 ring-sable-200" />
        </div>
      </section>

      {/* Trois promesses */}
      <section className="border-y border-sable-200 bg-sable-100/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          {[
            {
              icon: House,
              titre: "Un portefeuille varié",
              texte:
                "Villas, appartements, terrains et locaux, dans les meilleurs quartiers de Dakar.",
            },
            {
              icon: ShieldCheck,
              titre: "Des biens vérifiés",
              texte:
                "Chaque bien publié est suivi par nos agents, avec un statut juridique clair.",
            },
            {
              icon: MapPin,
              titre: "Ancrés à Dakar",
              texte:
                "Une connaissance fine du terrain, des Almadies à la banlieue.",
            },
          ].map((promesse) => (
            <div
              key={promesse.titre}
              className="rounded-2xl bg-sable-50 p-6 ring-1 ring-sable-200"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-bleu-profond/10 text-bleu-profond">
                <promesse.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-stone-900">
                {promesse.titre}
              </h3>
              <p className="mt-2 text-sm text-stone-600">{promesse.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Aperçu des biens — grille à venir (étape 2) */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Nos biens disponibles
          </h2>
          <Link
            href="/nos-biens"
            className="inline-flex items-center gap-1 text-sm font-medium text-terracotta-600 hover:text-terracotta-500"
          >
            Tout voir <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {apercu.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-sable-200 bg-sable-100/50 p-10 text-center text-sm text-stone-500">
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
    </>
  );
}
