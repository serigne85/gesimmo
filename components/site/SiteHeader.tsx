import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { AGENCE } from "@/lib/site/config";
import { whatsappHref, telHref } from "@/lib/utils/format";

/**
 * En-tête du site vitrine : marque + navigation + contact.
 * Server Component (aucune interactivité) — les liens suffisent. La navigation
 * se masque sous md ; la marque et le bouton WhatsApp restent toujours visibles,
 * le numéro d'appel direct apparaît à partir de lg.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-craie-200 bg-craie-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- petit logo statique local, <img> suffit. */}
          <img
            src="/logo-icon.png"
            alt={AGENCE.nom}
            className="h-9 w-9 rounded-lg"
          />
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            {AGENCE.nom}
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {[
            { href: "/", label: "Accueil" },
            { href: "/nos-biens", label: "Nos biens" },
            { href: "/contact", label: "Contact" },
          ].map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-marine"
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href={telHref(AGENCE.telephone)}
            className="hidden items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-marine lg:inline-flex"
          >
            <Phone className="h-4 w-4 text-marine" aria-hidden="true" />
            {AGENCE.telephone}
          </a>
          <a
            href={whatsappHref(AGENCE.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-marine px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-marine/20 transition-colors hover:bg-marine-hover"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Nous contacter</span>
          </a>
        </div>
      </div>
    </header>
  );
}
