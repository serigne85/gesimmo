import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  CalendarPlus,
  ListPlus,
  Building2,
  Pencil,
} from "lucide-react";
import { getContactDetail } from "@/services/contacts";
import type {
  BienLieContact,
  BailLieContact,
  DemandeLieeContact,
  MiseEnRelationLieeContact,
} from "@/types/contact";
import { formatFcfa, formatDate, telHref, whatsappHref } from "@/lib/utils/format";
import type { StatutBien } from "@/types/bien";
import type { StatutBail } from "@/types/bail";
import type { StatutMiseEnRelation } from "@/types/mise-en-relation";
import {
  OBJECTIF_DEMANDE_LABELS,
  type ObjectifDemande,
  type StatutDemande,
} from "@/types/demande";
import BadgeDesignation from "@/components/metier/BadgeDesignation";
import BadgeStatutBien from "@/components/metier/BadgeStatutBien";
import BadgeStatutBail from "@/components/metier/BadgeStatutBail";
import BadgeStatutDemande from "@/components/metier/BadgeStatutDemande";
import BadgeStatutMiseEnRelation from "@/components/metier/BadgeStatutMiseEnRelation";

/** Fiche détail d'un contact. Server Component (RLS active). */
export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContactDetail(id);
  if (!contact) notFound();

  const relanceHref = `/taches/nouveau?lienType=contact&lienId=${contact.id}&titre=${encodeURIComponent(
    `Relancer ${contact.nomComplet}`
  )}`;
  const rdvHref = `/agenda/nouveau?contactId=${contact.id}&titre=${encodeURIComponent(
    `Rendez-vous ${contact.nomComplet}`
  )}`;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux contacts
      </Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {contact.nomComplet}
            </h1>
            {contact.designations.map((d) => (
              <BadgeDesignation key={d} designation={d} />
            ))}
          </div>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {contact.telephone} · ajouté le {formatDate(contact.creeLe)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={telHref(contact.telephone)}
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title={`Appeler ${contact.telephone}`}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href={whatsappHref(contact.telephone)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
            title="WhatsApp"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={rdvHref}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Planifier un rendez-vous
        </Link>
        <Link
          href={relanceHref}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <ListPlus className="h-4 w-4" aria-hidden="true" />
          Créer une relance
        </Link>
        <Link
          href={`/contacts/${contact.id}/modifier`}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Identité civile
        </Link>
      </div>

      {/* Identité civile (pour les contrats) */}
      <Section titre="Identité civile">
        <div className="grid gap-x-6 gap-y-2 px-4 py-3 text-sm sm:grid-cols-3">
          <InfoIdentite
            libelle="Date de naissance"
            valeur={contact.dateNaissance ? formatDate(contact.dateNaissance) : null}
          />
          <InfoIdentite libelle="Lieu de naissance" valeur={contact.lieuNaissance} />
          <InfoIdentite libelle="N° CNI" valeur={contact.cni} />
        </div>
      </Section>

      {contact.biensProprietaire.length > 0 && (
        <Section titre={`Biens détenus (${contact.biensProprietaire.length})`}>
          {contact.biensProprietaire.map((b) => (
            <LigneBien key={b.id} bien={b} />
          ))}
        </Section>
      )}

      {contact.biensAssocie.length > 0 && (
        <Section titre={`Biens (contact associé) (${contact.biensAssocie.length})`}>
          {contact.biensAssocie.map((b) => (
            <LigneBien key={b.id} bien={b} />
          ))}
        </Section>
      )}

      {contact.baux.length > 0 && (
        <Section titre={`Baux (locataire) (${contact.baux.length})`}>
          {contact.baux.map((b) => (
            <LigneBail key={b.id} bail={b} />
          ))}
        </Section>
      )}

      {contact.demandes.length > 0 && (
        <Section titre={`Demandes (${contact.demandes.length})`}>
          {contact.demandes.map((d) => (
            <LigneDemande key={d.id} demande={d} />
          ))}
        </Section>
      )}

      {contact.misesEnRelation.length > 0 && (
        <Section titre={`Mises en relation (${contact.misesEnRelation.length})`}>
          {contact.misesEnRelation.map((m) => (
            <LigneMer key={m.id} mer={m} />
          ))}
        </Section>
      )}

      {contact.biensProprietaire.length === 0 &&
        contact.biensAssocie.length === 0 &&
        contact.baux.length === 0 &&
        contact.demandes.length === 0 &&
        contact.misesEnRelation.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Aucun bien, bail, demande ni mise en relation rattaché à ce contact.
          </div>
        )}
    </div>
  );
}

function InfoIdentite({
  libelle,
  valeur,
}: {
  libelle: string;
  valeur: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">{libelle}</p>
      <p className="text-zinc-800 dark:text-zinc-200">
        {valeur || <span className="text-zinc-400">À compléter</span>}
      </p>
    </div>
  );
}

function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        {titre}
      </h2>
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {children}
      </div>
    </div>
  );
}

function LigneBien({ bien }: { bien: BienLieContact }) {
  return (
    <Link
      href={`/biens/${bien.id}`}
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Building2 className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <span className="truncate text-sm text-zinc-800 dark:text-zinc-200">
          <span className="font-mono text-xs text-zinc-500">{bien.reference}</span>
          {bien.titre ? ` · ${bien.titre}` : ""}
        </span>
      </div>
      <BadgeStatutBien statut={bien.statut as StatutBien} />
    </Link>
  );
}

function LigneBail({ bail }: { bail: BailLieContact }) {
  return (
    <Link
      href={`/gestion-locative/${bail.id}`}
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <div className="min-w-0 text-sm text-zinc-800 dark:text-zinc-200">
        <span className="font-mono text-xs text-zinc-500">{bail.reference}</span>
        {bail.bienReference ? ` · ${bail.bienReference}` : ""} ·{" "}
        {formatFcfa(bail.loyerMensuel)}/mois
      </div>
      <BadgeStatutBail statut={bail.statut as StatutBail} />
    </Link>
  );
}

function LigneDemande({ demande }: { demande: DemandeLieeContact }) {
  return (
    <Link
      href={`/demandes/${demande.id}`}
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <span className="truncate text-sm text-zinc-800 dark:text-zinc-200">
        {OBJECTIF_DEMANDE_LABELS[demande.objectif as ObjectifDemande]}
      </span>
      <BadgeStatutDemande statut={demande.statut as StatutDemande} />
    </Link>
  );
}

function LigneMer({ mer }: { mer: MiseEnRelationLieeContact }) {
  return (
    <Link
      href={`/mises-en-relation/${mer.id}`}
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <span className="truncate text-sm text-zinc-800 dark:text-zinc-200">
        {mer.partenaireNom || "Partenaire"}
      </span>
      <BadgeStatutMiseEnRelation statut={mer.statut as StatutMiseEnRelation} />
    </Link>
  );
}
