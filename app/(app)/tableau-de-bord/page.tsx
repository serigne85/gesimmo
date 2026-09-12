import Link from "next/link";
import {
  Moon,
  FileClock,
  AlertTriangle,
  ListTodo,
  type LucideIcon,
} from "lucide-react";
import { getTableauDeBord } from "@/services/dashboard";
import { TYPE_MANDAT_LABELS } from "@/types/mandat";
import { TYPE_RENDEZ_VOUS_LABELS } from "@/types/rendez-vous";
import type { CompteurStatut } from "@/types/dashboard";
import { formatFcfa, formatMois, formatHeure } from "@/lib/utils/format";

/**
 * Tableau de bord opérationnel : ce qu'il faut voir et faire aujourd'hui.
 * Server Component (RLS active). Toute l'agrégation vit dans le service.
 */
export default async function TableauDeBordPage() {
  const tb = await getTableauDeBord();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Tableau de bord
        </h1>
        <p className="text-sm capitalize text-zinc-500 dark:text-zinc-400">
          {formatMois(`${tb.loyersMois.mois}-01`)}
        </p>
      </div>

      {/* Alertes actionnables */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Alerte
          href="/biens?statut=disponible"
          icon={Moon}
          label="Biens dormants"
          detail="Disponibles depuis plus de 60 jours"
          valeur={tb.alertes.biensDormants}
          urgent={tb.alertes.biensDormants > 0}
        />
        <Alerte
          href="/mandats"
          icon={FileClock}
          label="Mandats à renouveler"
          detail="Actifs, échéance sous 30 jours"
          valeur={tb.alertes.mandatsExpirant}
          urgent={tb.alertes.mandatsExpirant > 0}
        />
        <Alerte
          href="/paiements?situation=en_retard"
          icon={AlertTriangle}
          label="Loyers en retard"
          detail={formatFcfa(tb.alertes.loyersRetardMontant)}
          valeur={tb.alertes.loyersRetardNb}
          urgent={tb.alertes.loyersRetardNb > 0}
          rouge
        />
        <Alerte
          href="/taches"
          icon={ListTodo}
          label="Tâches en retard"
          detail="Échéance dépassée, non terminées"
          valeur={tb.alertes.tachesEnRetard}
          urgent={tb.alertes.tachesEnRetard > 0}
          rouge
        />
      </section>

      {/* Loyers du mois */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Loyers du mois
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Tuile label="Dû" valeur={formatFcfa(tb.loyersMois.du)} />
          <Tuile
            label="Encaissé"
            valeur={formatFcfa(tb.loyersMois.encaisse)}
            accent="text-green-700 dark:text-green-400"
          />
          <Tuile
            label="Reste"
            valeur={formatFcfa(tb.loyersMois.reste)}
            accent={
              tb.loyersMois.reste > 0
                ? "text-amber-600 dark:text-amber-400"
                : undefined
            }
          />
        </div>
      </section>

      {/* Portefeuille */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Portefeuille · {tb.portefeuille.total} bien
          {tb.portefeuille.total > 1 ? "s" : ""}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tb.portefeuille.compteurs.map((c) => (
            <Compteur key={c.statut} compteur={c} />
          ))}
        </div>
      </section>

      {/* Prospection terrain */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Prospection
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <TuileLien
            href="/prospects?relances=1"
            label="À relancer"
            valeur={tb.prospection.aRelancer}
            urgent={tb.prospection.aRelancer > 0}
          />
          <TuileLien
            href="/prospects?statut=disponible"
            label="Disponibles"
            valeur={tb.prospection.disponibles}
          />
          <TuileLien
            href="/prospects"
            label="Total en cours"
            valeur={tb.prospection.total}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mandats à renouveler */}
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Mandats à renouveler
          </h2>
          {tb.mandatsExpirantListe.length === 0 ? (
            <Vide texte="Aucun mandat n'expire dans les 30 jours." />
          ) : (
            <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {tb.mandatsExpirantListe.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/mandats/${m.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {m.reference} · {TYPE_MANDAT_LABELS[m.type]}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {m.bienReference}
                        {m.bienTitre ? ` · ${m.bienTitre}` : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-medium ${
                        m.joursRestants < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {m.joursRestants < 0
                        ? `Dépassé de ${-m.joursRestants} j`
                        : `Dans ${m.joursRestants} j`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Agenda du jour */}
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Agenda du jour
          </h2>
          {tb.rdvAujourdhui.length === 0 ? (
            <Vide texte="Aucun rendez-vous prévu aujourd'hui." />
          ) : (
            <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {tb.rdvAujourdhui.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/agenda/${r.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <span className="w-12 shrink-0 text-sm font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatHeure(r.debut)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                        {r.titre}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {TYPE_RENDEZ_VOUS_LABELS[r.type]}
                        {r.contactNom ? ` · ${r.contactNom}` : ""}
                        {r.bienReference ? ` · ${r.bienReference}` : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/** Carte d'alerte cliquable : un compteur actionnable. */
function Alerte({
  href,
  icon: Icon,
  label,
  detail,
  valeur,
  urgent,
  rouge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  detail: string;
  valeur: number;
  urgent: boolean;
  rouge?: boolean;
}) {
  const couleur = !urgent
    ? "text-zinc-400 dark:text-zinc-500"
    : rouge
      ? "text-red-600 dark:text-red-400"
      : "text-amber-600 dark:text-amber-400";
  return (
    <Link
      href={href}
      className="group flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-3 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${couleur}`} aria-hidden="true" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      </div>
      <span className={`text-2xl font-semibold tabular-nums ${couleur}`}>
        {valeur}
      </span>
      <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">
        {detail}
      </span>
    </Link>
  );
}

/** Compteur de portefeuille cliquable (vers la liste filtrée par statut). */
function Compteur({ compteur }: { compteur: CompteurStatut }) {
  return (
    <Link
      href={`/biens?statut=${compteur.statut}`}
      className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
        {compteur.label}
      </span>
      <span className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {compteur.nombre}
      </span>
    </Link>
  );
}

/** Tuile chiffrée cliquable (libellé + nombre), ambre si urgente. */
function TuileLien({
  href,
  label,
  valeur,
  urgent,
}: {
  href: string;
  label: string;
  valeur: number;
  urgent?: boolean;
}) {
  const couleur = urgent
    ? "text-amber-600 dark:text-amber-400"
    : "text-zinc-900 dark:text-zinc-100";
  return (
    <Link
      href={href}
      className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-3 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className={`text-lg font-semibold tabular-nums ${couleur}`}>
        {valeur}
      </span>
    </Link>
  );
}

/** Tuile de total simple. */
function Tuile({
  label,
  valeur,
  accent,
}: {
  label: string;
  valeur: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold ${accent ?? "text-zinc-900 dark:text-zinc-100"}`}
      >
        {valeur}
      </p>
    </div>
  );
}

/** État vide encadré. */
function Vide({ texte }: { texte: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      {texte}
    </div>
  );
}
