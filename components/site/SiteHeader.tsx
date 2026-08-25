import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { AGENCE } from "@/lib/site/config";
import { whatsappHref } from "@/lib/utils/format";

/**
 * En-tête du site vitrine : marque + navigation + bouton de contact WhatsApp.
 * Server Component (aucune interactivité) — les liens suffisent. Le menu se
 * réduit sur mobile : les liens de nav sont masqués sous md, la marque et le
 * bouton de contact restent toujours visibles.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-craie-200/70 bg-craie-50/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- petit logo statique local, <img> suffit. */}
          <img
            src="/logo-icon.png"
            alt={AGENCE.nom}
            className="h-9 w-9 rounded-lg"
          />
          <span className="font-display text-lg font-semibold text-slate-900">
            {AGENCE.nom}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Accueil
          </Link>
          <Link
            href="/nos-biens"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Nos biens
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Contact
          </Link>
        </nav>

        <a
          href={whatsappHref(AGENCE.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-marine px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-marine-hover"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Nous contacter</span>
        </a>
      </div>
    </header>
  );
}
