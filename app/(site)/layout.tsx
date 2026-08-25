import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { AGENCE, SITE_URL } from "@/lib/site/config";

/**
 * Police d'affichage du site vitrine : Fraunces, un serif moderne et chaleureux
 * pour les titres. Chargée via next/font (aucune dépendance à installer, les
 * fichiers sont auto-hébergés par Next). La variable CSS --font-fraunces est
 * consommée par l'utilitaire `font-display` défini dans globals.css.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
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
      className={`${fraunces.variable} flex min-h-full flex-col bg-sable-50 text-stone-900`}
    >
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
