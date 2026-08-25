import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { AGENCE } from "@/lib/site/config";
import { telHref } from "@/lib/utils/format";

/*
 * lucide-react ne fournit plus les logos de marques (Facebook, Instagram…) :
 * on les intègre en SVG, sans dépendance externe.
 */
function IconeFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
  );
}

function IconeInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M12 2c2.72 0 3.06.01 4.12.06 1.07.05 1.8.22 2.43.47.66.25 1.22.6 1.77 1.16.56.55.9 1.11 1.16 1.77.25.63.42 1.36.47 2.43.05 1.07.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.07-.22 1.8-.47 2.43a4.9 4.9 0 0 1-1.16 1.77c-.55.56-1.11.9-1.77 1.16-.63.25-1.36.42-2.43.47-1.07.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.07-.05-1.8-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.16 4.9 4.9 0 0 1-1.16-1.77c-.25-.63-.42-1.36-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.07.22-1.8.47-2.43.25-.66.6-1.22 1.16-1.77.55-.56 1.11-.9 1.77-1.16.63-.25 1.36-.42 2.43-.47C8.94 2.01 9.28 2 12 2Zm0 1.8c-2.67 0-2.99.01-4.04.06-.98.04-1.5.21-1.86.35-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.36-.31.88-.35 1.86-.05 1.05-.06 1.37-.06 4.04s.01 2.99.06 4.04c.04.98.21 1.5.35 1.86.18.47.4.8.75 1.15.35.35.68.57 1.15.75.36.14.88.31 1.86.35 1.05.05 1.37.06 4.04.06s2.99-.01 4.04-.06c.98-.04 1.5-.21 1.86-.35.47-.18.8-.4 1.15-.75.35-.35.57-.68.75-1.15.14-.36.31-.88.35-1.86.05-1.05.06-1.37.06-4.04s-.01-2.99-.06-4.04c-.04-.98-.21-1.5-.35-1.86a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.36-.14-.88-.31-1.86-.35C14.99 3.81 14.67 3.8 12 3.8Zm0 3.06a5.14 5.14 0 1 1 0 10.28 5.14 5.14 0 0 1 0-10.28Zm0 1.8a3.34 3.34 0 1 0 0 6.68 3.34 3.34 0 0 0 0-6.68Zm5.34-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
    </svg>
  );
}

/**
 * Pied de page du site vitrine : marque, navigation et coordonnées de l'agence.
 * Les liens réseaux ne s'affichent que si l'URL correspondante est renseignée
 * dans la configuration.
 */
export default function SiteFooter() {
  const annee = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-sable-200 bg-sable-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-bleu-profond text-sm font-bold text-white">
              M2S
            </span>
            <span className="font-display text-lg font-semibold text-stone-900">
              {AGENCE.nom}
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-stone-600">{AGENCE.slogan}</p>

          {(AGENCE.facebook || AGENCE.instagram) && (
            <div className="mt-4 flex items-center gap-3">
              {AGENCE.facebook && (
                <a
                  href={AGENCE.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="grid h-9 w-9 place-items-center rounded-full bg-sable-50 text-stone-600 ring-1 ring-sable-200 transition-colors hover:text-terracotta-600"
                >
                  <IconeFacebook />
                </a>
              )}
              {AGENCE.instagram && (
                <a
                  href={AGENCE.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="grid h-9 w-9 place-items-center rounded-full bg-sable-50 text-stone-600 ring-1 ring-sable-200 transition-colors hover:text-terracotta-600"
                >
                  <IconeInstagram />
                </a>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Navigation
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/" className="text-stone-600 hover:text-terracotta-600">
                Accueil
              </Link>
            </li>
            <li>
              <Link href="/nos-biens" className="text-stone-600 hover:text-terracotta-600">
                Nos biens
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-stone-600 hover:text-terracotta-600">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Contact
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-stone-600">
            <li>
              <a
                href={telHref(AGENCE.telephone)}
                className="inline-flex items-center gap-2 hover:text-terracotta-600"
              >
                <Phone className="h-4 w-4" aria-hidden="true" /> {AGENCE.telephone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${AGENCE.email}`}
                className="inline-flex items-center gap-2 hover:text-terracotta-600"
              >
                <Mail className="h-4 w-4" aria-hidden="true" /> {AGENCE.email}
              </a>
            </li>
            <li className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden="true" /> {AGENCE.adresse}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sable-200 py-4 text-center text-xs text-stone-500">
        © {annee} {AGENCE.nom}. Tous droits réservés.
      </div>
    </footer>
  );
}
