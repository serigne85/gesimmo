import { MapPin, ShieldCheck, PhoneCall, HeartHandshake } from "lucide-react";

/**
 * Section « Pourquoi nous choisir » de l'accueil : les atouts de l'agence.
 * Remplace l'ancien bloc « Trois promesses » (même intention, formulée côté
 * client). Contenu statique — Server Component.
 */
const ATOUTS = [
  {
    icon: MapPin,
    titre: "Expertise locale",
    texte:
      "Une connaissance fine des quartiers de Dakar, des Almadies à la banlieue.",
  },
  {
    icon: ShieldCheck,
    titre: "Des biens vérifiés",
    texte:
      "Chaque bien publié est suivi par nos agents, avec un statut juridique clair.",
  },
  {
    icon: PhoneCall,
    titre: "Réactivité",
    texte: "Un interlocuteur unique, joignable, qui répond vite à vos demandes.",
  },
  {
    icon: HeartHandshake,
    titre: "Accompagnement",
    texte:
      "Nous vous suivons du premier contact à la remise des clés, en toute transparence.",
  },
] as const;

export default function SectionPourquoi() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <span className="text-sm font-semibold uppercase tracking-wider text-orange-hover">
          Pourquoi nous choisir
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900">
          Ce qui fait la différence
        </h2>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ATOUTS.map((atout) => (
          <div
            key={atout.titre}
            className="rounded-2xl bg-craie-50 p-6 ring-1 ring-craie-200"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-marine/10 text-marine">
              <atout.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-slate-900">
              {atout.titre}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {atout.texte}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
