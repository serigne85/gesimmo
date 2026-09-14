import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { AGENCE, SITE_URL } from "@/lib/site/config";

/**
 * Police du site vitrine : DM Sans, un sans-serif moderne et géométrique, dans
 * l'esprit des portails immobiliers contemporains. Une seule famille sert à la
 * fois pour le texte courant (graisses 400/500) et les titres (600/700) : le
 * contraste vient du poids, pas d'un second caractère.
 *
 * Chargée via next/font (aucune dépendance à installer, fichiers auto-hébergés
 * par Next). La variable CSS `--font-display-family` est consommée par
 * l'utilitaire `font-display` et par la classe `.site-shell` (globals.css), ce
 * qui garde la police cantonnée au site vitrine — l'ERP interne n'est pas touché.
 */
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display-family",
  display: "swap",
});

export const metadata: Metadata = {
  // Base des URLs absolues : permet aux images Open Graph déclarées en relatif
  // (/api/vitrine/photo/…) d'être résolues en URL complète pour les partages.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${AGENCE.nom} — Immobilier à Dakar`,
    template: `%s — ${AGENCE.nom}`,
  },
  description:
    "Vente, location et gérance de biens immobiliers à Dakar. Découvrez les biens disponibles de M2S IMMO.",
};

/**
 * Layout du site vitrine PUBLIC — groupe de routes (site), sans authentification.
 * Distinct du layout (app) qui, lui, exige une session. Fond sable chaleureux,
 * en-tête collant et pied de page communs à toutes les pages publiques.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${dmSans.variable} site-shell flex min-h-full flex-col bg-craie-50 text-slate-900`}
    >
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
