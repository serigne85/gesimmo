import type { Metadata } from "next";
import { MapPin, Phone, Smartphone, Mail, MessageCircle } from "lucide-react";
import { AGENCE } from "@/lib/site/config";
import { telHref, whatsappHref } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contactez ${AGENCE.nom} à Dakar : adresse, téléphone, WhatsApp et e-mail.`,
};

/**
 * Page contact du site vitrine. Purement statique (Server Component) : elle
 * affiche les coordonnées de l'agence issues de la configuration, sous forme de
 * liens actionnables (appel, WhatsApp, e-mail, itinéraire). Pas de formulaire :
 * aucun service d'envoi d'e-mail n'est configuré — un formulaire serait un
 * champ mort. À ajouter plus tard si un backend d'envoi est mis en place.
 */
export default function ContactPage() {
  const mapsQuery = encodeURIComponent(`${AGENCE.adresse}, Sénégal`);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const message = `Bonjour, je vous contacte via votre site ${AGENCE.nom}.`;
  const waHref = `${whatsappHref(AGENCE.whatsapp)}?text=${encodeURIComponent(message)}`;

  const infos = [
    {
      icon: MapPin,
      label: "Adresse",
      valeur: AGENCE.adresse,
      href: mapsHref,
      externe: true,
    },
    {
      icon: Phone,
      label: "Téléphone fixe",
      valeur: AGENCE.telephone,
      href: telHref(AGENCE.telephone),
      externe: false,
    },
    {
      icon: Smartphone,
      label: "Téléphone portable",
      valeur: AGENCE.mobile,
      href: telHref(AGENCE.mobile),
      externe: false,
    },
    {
      icon: Mail,
      label: "E-mail",
      valeur: AGENCE.email,
      href: `mailto:${AGENCE.email}`,
      externe: false,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <span className="text-sm font-semibold uppercase tracking-wider text-orange-hover">
          Contact
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Parlons de votre projet
        </h1>
        <p className="mt-3 text-slate-600">
          Une question, un bien à confier, une visite à organiser ? Notre équipe
          vous répond à Dakar.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Coordonnées */}
        <div>
          <ul className="space-y-4">
            {infos.map((info) => (
              <li key={info.label}>
                <a
                  href={info.href}
                  target={info.externe ? "_blank" : undefined}
                  rel={info.externe ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-craie-200 transition-colors hover:ring-marine"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-marine/10 text-marine">
                    <info.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {info.label}
                    </span>
                    <span className="block truncate font-semibold text-slate-800">
                      {info.valeur}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-marine px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-marine-hover"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Écrire sur
            WhatsApp
          </a>
        </div>

        {/* Carte */}
        <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-craie-200">
          <iframe
            title={`Localisation de ${AGENCE.nom}`}
            src={`https://maps.google.com/maps?q=${mapsQuery}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full min-h-80 w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
