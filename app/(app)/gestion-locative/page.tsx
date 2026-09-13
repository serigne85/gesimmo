import Link from "next/link";
import { Plus, Phone, MessageCircle } from "lucide-react";
import {
  listBaux,
  listBauxParProprietaire,
  BAUX_PAGE_SIZE,
} from "@/services/baux";
import { formatFcfa, telHref, whatsappHref } from "@/lib/utils/format";
import { getUtilisateurConnecte } from "@/services/auth";
import type { BailListe, GroupeBauxProprietaire } from "@/types/bail";
import TableauBaux from "@/components/metier/TableauBaux";

/**
 * Liste des baux de l'agence. Server Component : données chargées côté serveur
 * (RLS active), présentées en tableau (écran de pilotage).
 *
 * Deux vues via ?vue= :
 *  - défaut : tous les baux, paginés (?page=) ;
 *  - « proprietaire » : baux regroupés par propriétaire (pas de pagination,
 *    échelle V1).
 */
export default async function GestionLocativePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; vue?: string }>;
}) {
  const { page: pageParam, vue } = await searchParams;
  const parProprietaire = vue === "proprietaire";

  // On ne charge que les données de la vue demandée.
  const page = Math.max(1, Number(pageParam) || 1);
  const [profil, groupes, bauxPage] = await Promise.all([
    getUtilisateurConnecte(),
    parProprietaire ? listBauxParProprietaire() : Promise.resolve(null),
    parProprietaire ? Promise.resolve(null) : listBaux(page),
  ]);
  const peutGerer = profil?.role === "admin";

  const sousTitre = parProprietaire
    ? `${groupes!.length} propriétaire${groupes!.length > 1 ? "s" : ""} avec baux`
    : `${bauxPage!.total} bail${bauxPage!.total > 1 ? "s" : ""} en portefeuille`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Gestion locative
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{sousTitre}</p>
        </div>
        <Link
          href="/gestion-locative/nouveau"
          className="flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau bail
        </Link>
      </div>

      {/* Bascule de vue (même patron que les onglets Paiements). */}
      <div className="flex gap-2">
        <OngletVue label="Tous les baux" cible="/gestion-locative" actif={!parProprietaire} />
        <OngletVue
          label="Par propriétaire"
          cible="/gestion-locative?vue=proprietaire"
          actif={parProprietaire}
        />
      </div>

      {parProprietaire ? (
        <VueParProprietaire groupes={groupes!} peutGerer={peutGerer} />
      ) : (
        <VueTousLesBaux
          rows={bauxPage!.rows}
          total={bauxPage!.total}
          page={page}
          peutGerer={peutGerer}
        />
      )}
    </div>
  );
}

/** Message d'invite quand aucun bail n'existe. */
function AucunBail() {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      Aucun bail pour l&apos;instant. Créez-en un depuis un bien en location.
    </div>
  );
}

/** Vue « Tous les baux » : tableau paginé. */
function VueTousLesBaux({
  rows,
  total,
  page,
  peutGerer,
}: {
  rows: BailListe[];
  total: number;
  page: number;
  peutGerer: boolean;
}) {
  if (rows.length === 0) return <AucunBail />;
  const nbPages = Math.max(1, Math.ceil(total / BAUX_PAGE_SIZE));

  return (
    <div className="space-y-4">
      <TableauBaux baux={rows} peutGerer={peutGerer} />
      {nbPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <PaginationLien page={page - 1} disabled={page <= 1} label="Précédent" />
          <span className="text-zinc-500 dark:text-zinc-400">
            Page {page} / {nbPages}
          </span>
          <PaginationLien page={page + 1} disabled={page >= nbPages} label="Suivant" />
        </div>
      )}
    </div>
  );
}

/** Vue « Par propriétaire » : une section par propriétaire. */
function VueParProprietaire({
  groupes,
  peutGerer,
}: {
  groupes: GroupeBauxProprietaire[];
  peutGerer: boolean;
}) {
  if (groupes.length === 0) return <AucunBail />;

  return (
    <div className="space-y-6">
      {groupes.map((groupe) => (
        <section key={groupe.proprietaireId} className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {groupe.proprietaireId ? (
                  <Link
                    href={`/contacts/${groupe.proprietaireId}`}
                    className="hover:underline"
                  >
                    {groupe.proprietaireNom || "Propriétaire inconnu"}
                  </Link>
                ) : (
                  groupe.proprietaireNom || "Propriétaire inconnu"
                )}
                <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  {groupe.baux.length} bail{groupe.baux.length > 1 ? "s" : ""}
                </span>
              </h2>
              {groupe.proprietaireTelephone && (
                <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {groupe.proprietaireTelephone}
                  <a
                    href={telHref(groupe.proprietaireTelephone)}
                    title={`Appeler ${groupe.proprietaireTelephone}`}
                    className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-blue-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <a
                    href={whatsappHref(groupe.proprietaireTelephone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                    className="rounded-md p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </span>
              )}
            </div>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {formatFcfa(groupe.totalLoyer)}
              <span className="text-xs font-normal text-zinc-400"> /mois</span>
            </span>
          </div>
          <TableauBaux baux={groupe.baux} peutGerer={peutGerer} />
        </section>
      ))}
    </div>
  );
}

/** Un onglet de bascule de vue. */
function OngletVue({
  label,
  cible,
  actif,
}: {
  label: string;
  cible: string;
  actif: boolean;
}) {
  const base = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  const on = "bg-blue-900 text-white";
  const off =
    "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900";
  return (
    <Link href={cible} className={`${base} ${actif ? on : off}`}>
      {label}
    </Link>
  );
}

function PaginationLien({
  page,
  disabled,
  label,
}: {
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return <span className="text-zinc-300 dark:text-zinc-700">{label}</span>;
  }
  return (
    <Link
      href={`/gestion-locative?page=${page}`}
      className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {label}
    </Link>
  );
}
