import Link from "next/link";
import { Tag, KeyRound, ClipboardList, ArrowRight } from "lucide-react";

/**
 * Section « Nos services » de l'accueil : les trois métiers de l'agence
 * (vente, location, gérance locative). Contenu statique — Server Component.
 * Chaque carte renvoie vers la liste des biens filtrée quand c'est pertinent.
 */
const SERVICES = [
  {
    icon: Tag,
    titre: "Vente",
    texte:
      "Nous commercialisons votre bien au juste prix et accompagnons les acquéreurs jusqu'à la signature.",
    lien: { href: "/nos-biens?objectif=vente", label: "Biens à vendre" },
  },
  {
    icon: KeyRound,
    titre: "Location",
    texte:
      "Nous trouvons rapidement des locataires sérieux et sécurisons chaque étape de la mise en location.",
    lien: { href: "/nos-biens?objectif=location", label: "Biens à louer" },
  },
  {
    icon: ClipboardList,
    titre: "Gérance locative",
    texte:
      "Nous gérons votre bien au quotidien : loyers, échéances, relations locataires et suivi des paiements.",
    lien: { href: "/contact", label: "Nous confier un bien" },
  },
] as const;

export default function SectionServices() {
  return (
    <section className="border-y border-craie-200 bg-craie-100/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wider text-orange-hover">
            Nos services
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900">
            Un accompagnement pour chaque projet
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {SERVICES.map((service) => (
            <div
              key={service.titre}
              className="flex flex-col rounded-2xl bg-white p-7 shadow-sm ring-1 ring-craie-200"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-marine text-white">
                <service.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-slate-900">
                {service.titre}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {service.texte}
              </p>
              <Link
                href={service.lien.href}
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-marine hover:text-marine-hover"
              >
                {service.lien.label}{" "}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
