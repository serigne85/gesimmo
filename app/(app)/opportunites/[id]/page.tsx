import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  User,
  Search,
  Phone,
  MessageCircle,
  FileSignature,
  Trophy,
  XCircle,
} from "lucide-react";
import { getUtilisateurConnecte } from "@/services/auth";
import { getOpportuniteDetail } from "@/services/opportunites";
import {
  formatFcfa,
  formatDate,
  formatDateHeure,
  telHref,
  whatsappHref,
} from "@/lib/utils/format";
import { TYPE_SUIVI_LABELS } from "@/types/opportunite";
import BadgeStatutOpportunite from "@/components/metier/BadgeStatutOpportunite";
import ChangerEtapeOpportunite from "@/components/metier/ChangerEtapeOpportunite";
import FormulaireSuiviOpportunite from "@/components/metier/FormulaireSuiviOpportunite";

/**
 * Fiche détail d'une opportunité : résumé + liens, changement d'étape (qui
 * pilote le statut), conclusion (gagnée/perdue) et journal chronologique.
 * Réservée aux rôles commerciaux (contrôle serveur).
 */
export default async function OpportunitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profil = await getUtilisateurConnecte();
  if (
    !profil ||
    !profil.actif ||
    !["admin", "direction", "agent"].includes(profil.role)
  ) {
    redirect("/opportunites");
  }

  const { id } = await params;
  const opp = await getOpportuniteDetail(id);
  if (!opp) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/opportunites"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Opportunités
      </Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {opp.reference}
            </span>
            <BadgeStatutOpportunite statut={opp.statut} />
          </div>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {opp.titre}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {opp.pipelineNom} · étape « {opp.etapeNom} »
          </p>
        </div>
        {opp.montantEstime != null && (
          <div className="text-right">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Montant estimé</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {formatFcfa(opp.montantEstime)}
            </p>
          </div>
        )}
      </div>

      {/* Conclusion : gagnée / perdue */}
      {opp.statut === "gagnee" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/50">
          <p className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
            <Trophy className="h-4 w-4" aria-hidden="true" />
            Opportunité gagnée{opp.dateCloture ? ` le ${formatDate(opp.dateCloture)}` : ""}.
          </p>
          {opp.demandeId && (
            <p className="mt-1 text-sm text-green-700 dark:text-green-400">
              La demande liée a été marquée « satisfaite ».
            </p>
          )}
          {opp.bienId && (
            <Link
              href="/mandats/nouveau"
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
            >
              <FileSignature className="h-4 w-4" aria-hidden="true" />
              Créer le mandat
            </Link>
          )}
        </div>
      )}
      {opp.statut === "perdue" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
          <p className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-300">
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Opportunité perdue{opp.dateCloture ? ` le ${formatDate(opp.dateCloture)}` : ""}.
          </p>
          {opp.motifPerte && (
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              Motif : {opp.motifPerte}
            </p>
          )}
        </div>
      )}

      {/* Liens métier */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Liens
        </h2>
        <dl className="space-y-3 text-sm">
          <LigneLien icon={Building2} label="Bien">
            {opp.bienId ? (
              <Link
                href={`/biens/${opp.bienId}`}
                className="text-blue-800 hover:underline dark:text-blue-300"
              >
                {opp.bienReference}
                {opp.bienTitre ? ` · ${opp.bienTitre}` : ""}
              </Link>
            ) : (
              <span className="text-zinc-400">—</span>
            )}
          </LigneLien>

          <LigneLien icon={User} label="Contact">
            {opp.contactId ? (
              <span className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/contacts/${opp.contactId}`}
                  className="text-blue-800 hover:underline dark:text-blue-300"
                >
                  {opp.contactNom}
                </Link>
                {opp.contactTelephone && (
                  <>
                    <span className="text-zinc-400">{opp.contactTelephone}</span>
                    <a
                      href={telHref(opp.contactTelephone)}
                      title="Appeler"
                      className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-blue-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <a
                      href={whatsappHref(opp.contactTelephone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp"
                      className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-green-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </>
                )}
              </span>
            ) : (
              <span className="text-zinc-400">—</span>
            )}
          </LigneLien>

          <LigneLien icon={Search} label="Demande">
            {opp.demandeId ? (
              <Link
                href={`/demandes/${opp.demandeId}`}
                className="text-blue-800 hover:underline dark:text-blue-300"
              >
                Voir la demande{opp.demandeStatut ? ` (${opp.demandeStatut})` : ""}
              </Link>
            ) : (
              <span className="text-zinc-400">—</span>
            )}
          </LigneLien>

          <LigneLien icon={User} label="Responsable">
            <span>{opp.responsableNom ?? "—"}</span>
          </LigneLien>
        </dl>
      </div>

      {/* Changement d'étape (masqué si conclue : on peut toujours rouvrir en
          repassant à une étape normale via le sélecteur, donc on l'affiche
          toujours). */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Faire avancer l&apos;opportunité
        </h2>
        <ChangerEtapeOpportunite
          opportuniteId={opp.id}
          etapeCouranteId={opp.etapeId}
          etapes={opp.etapes}
        />
      </div>

      {/* Journal de suivi */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Suivi
        </h2>
        <FormulaireSuiviOpportunite opportuniteId={opp.id} />

        {opp.journal.length > 0 ? (
          <ol className="mt-4 space-y-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
            {opp.journal.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-blue-800" />
                <p className="text-sm text-zinc-800 dark:text-zinc-200">
                  {e.description}
                </p>
                <p className="text-xs text-zinc-400">
                  {formatDateHeure(e.dateEvenement)}
                  {e.auteurNom ? ` · ${e.auteurNom}` : ""}
                  {` · ${TYPE_SUIVI_LABELS[e.type]}`}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-zinc-400">Aucun événement pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}

function LigneLien({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <dt className="flex w-28 shrink-0 items-center gap-2 text-zinc-500 dark:text-zinc-400">
        <Icon className="h-4 w-4" aria-hidden={true} />
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-zinc-800 dark:text-zinc-200">{children}</dd>
    </div>
  );
}
