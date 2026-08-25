import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  MapPin,
  Ruler,
  BedDouble,
  ShieldCheck,
  Phone,
  Mail,
  MessageCircle,
  Video,
} from "lucide-react";
import { getBienVitrineById } from "@/services/vitrine";
import {
  TYPE_BIEN_LABELS,
  STATUT_JURIDIQUE_LABELS,
} from "@/types/bien";
import { formatFcfa, whatsappHref } from "@/lib/utils/format";
import { AGENCE, SITE_URL } from "@/lib/site/config";
import GalerieBienVitrine from "@/components/site/GalerieBienVitrine";
import BoutonsPartage from "@/components/site/BoutonsPartage";

/**
 * `cache()` mémorise le résultat le temps d'UNE requête : la fiche est lue une
 * seule fois, même si generateMetadata et la page l'appellent toutes les deux.
 */
const chargerBien = cache(getBienVitrineById);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const bien = await chargerBien(id);
  if (!bien) return { title: "Bien introuvable" };

  const lieu = [bien.villeNom, bien.zoneNom].filter(Boolean).join(" · ");
  const titre = bien.titre ?? `${TYPE_BIEN_LABELS[bien.type]}${lieu ? ` à ${lieu}` : ""}`;
  const description =
    bien.description?.slice(0, 155) ??
    `${TYPE_BIEN_LABELS[bien.type]} ${bien.objectif === "location" ? "à louer" : "à vendre"}${lieu ? ` à ${lieu}` : ""} — ${AGENCE.nom}.`;

  // Image d'aperçu (partage) : la route-image stable, résolue en URL absolue via
  // metadataBase. Absente si le bien n'a pas de photo.
  const images =
    bien.photos.length > 0
      ? [{ url: `/api/vitrine/photo/${bien.id}`, width: 1200, height: 900, alt: titre }]
      : [];

  return {
    title: titre,
    description,
    openGraph: {
      title: `${titre} — ${AGENCE.nom}`,
      description,
      type: "website",
      url: `/nos-biens/${bien.id}`,
      images,
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title: `${titre} — ${AGENCE.nom}`,
      description,
      images,
    },
  };
}

/**
 * Fiche détail publique d'un bien. Server Component : lecture serveur via le
 * service vitrine (bien `disponible` uniquement, sans donnée propriétaire ni
 * adresse exacte). Un id inconnu ou invalide affiche la page 404.
 */
export default async function FicheBienPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bien = await chargerBien(id);
  if (!bien) notFound();

  const lieu = [bien.villeNom, bien.zoneNom].filter(Boolean).join(" · ");
  const titre = bien.titre ?? TYPE_BIEN_LABELS[bien.type];
  const objectifLabel = bien.objectif === "location" ? "À louer" : "À vendre";
  const objectifClasse =
    bien.objectif === "location" ? "bg-terracotta-500" : "bg-bleu-profond";
  const prix =
    bien.prix === null
      ? "Prix sur demande"
      : bien.objectif === "location"
        ? `${formatFcfa(bien.prix)} / mois`
        : formatFcfa(bien.prix);

  // Bouton WhatsApp pré-rempli, vers le numéro de l'AGENCE (jamais le propriétaire).
  const message = `Bonjour, je suis intéressé(e) par le bien ${bien.reference}${
    bien.titre ? ` (${bien.titre})` : ""
  } vu sur votre site.`;
  const waHref = `${whatsappHref(AGENCE.whatsapp)}?text=${encodeURIComponent(message)}`;

  const caracteristiques = [
    { icon: MapPin, label: "Localisation", valeur: lieu || "—" },
    { icon: Ruler, label: "Surface", valeur: bien.surface ? `${bien.surface} m²` : "—" },
    {
      icon: BedDouble,
      label: "Chambres",
      valeur: bien.nombreChambres !== null ? String(bien.nombreChambres) : "—",
    },
    {
      icon: ShieldCheck,
      label: "Statut juridique",
      valeur: bien.statutJuridique
        ? STATUT_JURIDIQUE_LABELS[bien.statutJuridique]
        : "—",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/nos-biens"
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-terracotta-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour aux biens
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Colonne principale : galerie + caractéristiques + description */}
        <div className="lg:col-span-2">
          <GalerieBienVitrine photos={bien.photos} alt={titre} />

          <div className="mt-8">
            <h2 className="font-display text-xl font-semibold text-stone-900">
              Caractéristiques
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {caracteristiques.map((c) => (
                <div
                  key={c.label}
                  className="rounded-xl bg-sable-100/60 p-4 ring-1 ring-sable-200"
                >
                  <c.icon
                    className="h-5 w-5 text-terracotta-600"
                    aria-hidden="true"
                  />
                  <dt className="mt-2 text-xs text-stone-500">{c.label}</dt>
                  <dd className="text-sm font-medium text-stone-800">
                    {c.valeur}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {bien.description && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold text-stone-900">
                Description
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
                {bien.description}
              </p>
            </div>
          )}

          {bien.videoUrl && (
            <a
              href={bien.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-sable-200 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-sable-100"
            >
              <Video className="h-4 w-4" aria-hidden="true" /> Voir la vidéo du bien
            </a>
          )}
        </div>

        {/* Colonne latérale : prix + contact (collante sur grand écran) */}
        <aside className="lg:col-span-1">
          <div className="rounded-2xl bg-sable-50 p-6 ring-1 ring-sable-200 lg:sticky lg:top-24">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold text-white ${objectifClasse}`}
            >
              {objectifLabel}
            </span>
            <h1 className="mt-3 font-display text-2xl font-semibold text-stone-900">
              {titre}
            </h1>
            {lieu && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" /> {lieu}
              </p>
            )}
            <p className="mt-4 font-display text-2xl font-semibold text-terracotta-600">
              {prix}
            </p>
            <p className="mt-1 font-mono text-xs text-stone-400">
              Réf. {bien.reference}
            </p>

            <div className="mt-6 space-y-2">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-bleu-profond px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-bleu-profond-hover"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Contacter
                sur WhatsApp
              </a>
              <a
                href={`tel:${AGENCE.telephone.replace(/\s/g, "")}`}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-sable-100"
              >
                <Phone className="h-4 w-4" aria-hidden="true" /> Appeler l&apos;agence
              </a>
              <a
                href={`mailto:${AGENCE.email}?subject=${encodeURIComponent(`Bien ${bien.reference}`)}`}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-sable-100"
              >
                <Mail className="h-4 w-4" aria-hidden="true" /> Écrire un e-mail
              </a>
            </div>

            <div className="mt-6 border-t border-sable-200 pt-6">
              <BoutonsPartage
                url={`${SITE_URL}/nos-biens/${bien.id}`}
                titre={titre}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
