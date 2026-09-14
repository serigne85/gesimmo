import { Building2, KeyRound, ClipboardList } from "lucide-react";
import { AGENCE } from "@/lib/site/config";

/**
 * Section « À propos » de l'accueil : présente l'agence en deux colonnes
 * (texte à gauche, panneau de marque à droite). Contenu purement statique,
 * aucune donnée dynamique — d'où un simple Server Component sans props.
 */
export default function SectionApropos() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-orange-hover">
            À propos
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900">
            {AGENCE.nom}, votre partenaire immobilier à Dakar
          </h2>
          <p className="mt-5 leading-relaxed text-slate-600">
            {AGENCE.nom} accompagne particuliers, familles et investisseurs dans
            tous leurs projets immobiliers à Dakar : achat, vente, location et
            gérance de biens. Nous mettons notre connaissance du terrain, des
            Almadies à la banlieue, au service de vos décisions.
          </p>
          <p className="mt-4 leading-relaxed text-slate-600">
            Chaque bien de notre portefeuille est suivi par nos agents, avec un
            statut juridique clair et un interlocuteur unique. Notre objectif :
            des transactions sereines et transparentes, du premier contact à la
            remise des clés.
          </p>
        </div>

        {/* Panneau de marque (visuel, sans photo) */}
        <div className="relative overflow-hidden rounded-3xl bg-marine-950 p-8 text-white sm:p-10">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange/25 blur-3xl"
            aria-hidden="true"
          />
          <p className="relative font-display text-xl font-semibold leading-relaxed">
            « {AGENCE.slogan} »
          </p>
          <ul className="relative mt-8 space-y-4">
            {[
              { icon: KeyRound, texte: "Vente & location de biens" },
              { icon: ClipboardList, texte: "Gérance locative pour propriétaires" },
              { icon: Building2, texte: "Un ancrage local, à Dakar" },
            ].map((item) => (
              <li key={item.texte} className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-orange ring-1 ring-white/15">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-craie-200/90">{item.texte}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
