import Link from "next/link";
import { Plus, Phone, MessageCircle, SlidersHorizontal } from "lucide-react";
import { getVuesPipeline } from "@/services/opportunites";
import { getUtilisateurConnecte } from "@/services/auth";
import { estAdminOuDirection } from "@/types/roles";
import { formatFcfa, telHref, whatsappHref } from "@/lib/utils/format";
import type { ColonneEtape, VuePipeline } from "@/types/opportunite";

/**
 * Vue « pipeline » des opportunités : un bloc par pipeline, une barre résumant
 * toutes les étapes (le flux complet), puis le détail des opportunités OUVERTES
 * groupées par étape. Server Component, RLS active. Les pipelines par défaut sont
 * créés au premier chargement (voir services/opportunites).
 */
export default async function OpportunitesPage() {
  const [vues, profil] = await Promise.all([
    getVuesPipeline(),
    getUtilisateurConnecte(),
  ]);
  const totalOuvert = vues.reduce((s, v) => s + v.total, 0);
  const peutConfigurer = profil ? estAdminOuDirection(profil.role) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Opportunités
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {totalOuvert} opportunité{totalOuvert > 1 ? "s" : ""} ouverte
            {totalOuvert > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {peutConfigurer && (
            <Link
              href="/opportunites/pipelines"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Pipelines
            </Link>
          )}
          <Link
            href="/opportunites/nouveau"
            className="flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvelle opportunité
          </Link>
        </div>
      </div>

      {vues.map((vue) => (
        <BlocPipeline key={vue.pipeline.id} vue={vue} />
      ))}
    </div>
  );
}

/** Un pipeline : barre de flux (toutes les étapes) + détail par étape. */
function BlocPipeline({ vue }: { vue: VuePipeline }) {
  const colonnesGarnies = vue.colonnes.filter((c) => c.opportunites.length > 0);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {vue.pipeline.nom}
          <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
            {vue.total} ouverte{vue.total > 1 ? "s" : ""}
          </span>
        </h2>
      </div>

      {/* Barre de flux : toutes les étapes avec leur compteur (aperçu du pipeline). */}
      <div className="flex flex-wrap gap-1.5">
        {vue.colonnes.map((c) => (
          <span
            key={c.etape.id}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${chipClasse(
              c
            )}`}
          >
            {c.etape.nom}
            <span className="font-semibold">{c.opportunites.length}</span>
          </span>
        ))}
      </div>

      {/* Détail : opportunités groupées par étape (étapes vides masquées). */}
      {colonnesGarnies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucune opportunité ouverte dans ce pipeline.
        </div>
      ) : (
        <div className="space-y-4">
          {colonnesGarnies.map((c) => (
            <ColonneDetail key={c.etape.id} colonne={c} />
          ))}
        </div>
      )}
    </section>
  );
}

/** Le détail d'une étape : en-tête + lignes d'opportunités. */
function ColonneDetail({ colonne }: { colonne: ColonneEtape }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <span className="font-medium">
          {colonne.etape.nom} · {colonne.opportunites.length}
        </span>
        {colonne.totalEstime > 0 && (
          <span className="normal-case">{formatFcfa(colonne.totalEstime)}</span>
        )}
      </div>
      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {colonne.opportunites.map((o) => (
          <li
            key={o.id}
            className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {o.reference}
                </span>
                <Link
                  href={`/opportunites/${o.id}`}
                  className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                >
                  {o.titre}
                </Link>
              </div>
              <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
                {[o.contactNom, o.bienReference].filter(Boolean).join(" · ") ||
                  "Sans lien"}
              </p>
            </div>
            <div className="flex items-center gap-3 sm:justify-end">
              {o.montantEstime != null && (
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {formatFcfa(o.montantEstime)}
                </span>
              )}
              {o.contactTelephone && (
                <div className="flex items-center gap-1">
                  <a
                    href={telHref(o.contactTelephone)}
                    title={`Appeler ${o.contactTelephone}`}
                    className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a
                    href={whatsappHref(o.contactTelephone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                    className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-green-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Couleur de la pastille d'étape dans la barre de flux (selon son type). */
function chipClasse(c: ColonneEtape): string {
  if (c.opportunites.length === 0) {
    return "border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600";
  }
  if (c.etape.type === "gain") {
    return "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300";
  }
  if (c.etape.type === "perte") {
    return "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300";
  }
  return "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200";
}
