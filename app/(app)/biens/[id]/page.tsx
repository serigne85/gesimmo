import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle, Pencil, Video } from "lucide-react";
import { getBienById } from "@/services/biens";
import { getPhotosBien } from "@/services/photos";
import { demandesCorrespondantes } from "@/services/matching";
import {
  TYPE_BIEN_LABELS,
  OBJECTIF_LABELS,
  STATUT_JURIDIQUE_LABELS,
} from "@/types/bien";
import { formatFcfa, formatDate, telHref, whatsappHref } from "@/lib/utils/format";
import BadgeStatutBien from "@/components/metier/BadgeStatutBien";
import ActionsStatutBien from "@/components/metier/ActionsStatutBien";
import GaleriePhotos from "@/components/metier/GaleriePhotos";
import LigneDemande from "@/components/metier/LigneDemande";

/**
 * Fiche détail d'un bien. Server Component : chargé côté serveur (RLS active).
 * Le segment dynamique [id] fournit l'identifiant via params.
 */
export default async function BienDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bien = await getBienById(id);
  if (!bien) notFound();

  const photos = await getPhotosBien(bien.id);
  const demandes = await demandesCorrespondantes({
    objectif: bien.objectif,
    zoneId: bien.zoneId,
    type: bien.type,
    prix: bien.prix,
    nombreChambres: bien.nombreChambres,
    surface: bien.surface,
  });
  const lieu = [bien.zoneNom, bien.villeNom].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/biens"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux biens
      </Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {bien.reference}
          </span>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {bien.titre || TYPE_BIEN_LABELS[bien.type]}
          </h1>
          {bien.titre && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              · {TYPE_BIEN_LABELS[bien.type]}
            </span>
          )}
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            · {OBJECTIF_LABELS[bien.objectif]}
          </span>
          <BadgeStatutBien statut={bien.statut} />
        </div>
        <Link
          href={`/biens/${bien.id}/modifier`}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Modifier
        </Link>
      </div>

      {/* Caractéristiques */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Champ label="Prix">{formatFcfa(bien.prix)}</Champ>
          <Champ label="Localisation">{lieu || "Non précisée"}</Champ>
          <Champ label="Adresse">{bien.adresse || "Non précisée"}</Champ>
          <Champ label="Surface">
            {bien.surface ? `${bien.surface} m²` : "—"}
          </Champ>
          <Champ label="Chambres">{bien.nombreChambres ?? "—"}</Champ>
          <Champ label="Statut juridique">
            {bien.statutJuridique
              ? STATUT_JURIDIQUE_LABELS[bien.statutJuridique]
              : "Non renseigné"}
          </Champ>
          <Champ label="Saisi le">{formatDate(bien.creeLe)}</Champ>
          {bien.description && (
            <div className="sm:col-span-2">
              <Champ label="Description">
                <span className="whitespace-pre-line">{bien.description}</span>
              </Champ>
            </div>
          )}
        </dl>
      </div>

      {/* Photos et vidéo */}
      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <GaleriePhotos bienId={bien.id} photos={photos} />
        {bien.videoUrl && (
          <a
            href={bien.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-800 hover:underline dark:text-blue-300"
          >
            <Video className="h-4 w-4" aria-hidden="true" />
            Voir la vidéo
          </a>
        )}
      </div>

      {/* Cycle de vie */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Cycle de vie
          </h2>
          <BadgeStatutBien statut={bien.statut} />
        </div>
        {bien.statut === "a_relancer" && (
          <p className="mb-3 text-sm text-amber-700 dark:text-amber-500">
            Relance prévue le{" "}
            <span className="font-medium">
              {bien.dateRelance ? formatDate(bien.dateRelance) : "date non précisée"}
            </span>
          </p>
        )}
        <ActionsStatutBien
          id={bien.id}
          statut={bien.statut}
          objectif={bien.objectif}
        />
      </div>

      {/* Demandes correspondantes (matching) */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Demandes correspondantes ({demandes.length})
        </h2>
        {demandes.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Aucune demande client ne correspond pour l&apos;instant.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {demandes.map((demande) => (
              <LigneDemande key={demande.id} demande={demande} />
            ))}
          </ul>
        )}
      </div>

      {/* Propriétaire */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Propriétaire
        </h2>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
              {bien.proprietaireNom || "—"}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {bien.proprietaireTelephone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={telHref(bien.proprietaireTelephone)}
              className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title={`Appeler ${bien.proprietaireTelephone}`}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={whatsappHref(bien.proprietaireTelephone)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
              title="WhatsApp"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* Contact secondaire (si renseigné) */}
      {bien.contactNom && bien.contactTelephone && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Contact
          </h2>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                {bien.contactNom}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {bien.contactTelephone}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={telHref(bien.contactTelephone)}
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title={`Appeler ${bien.contactTelephone}`}
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={whatsappHref(bien.contactTelephone)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Une paire libellé / valeur de la fiche. */
function Champ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">
        {children}
      </dd>
    </div>
  );
}
