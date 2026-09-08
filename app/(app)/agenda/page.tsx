import Link from "next/link";
import { Plus, MapPin, User, Building2 } from "lucide-react";
import { listRendezVous } from "@/services/rendez-vous";
import {
  TYPE_RENDEZ_VOUS_LABELS,
  type TypeRendezVous,
} from "@/types/rendez-vous";
import { formatHeure } from "@/lib/utils/format";
import BadgeStatutRendezVous from "@/components/metier/BadgeStatutRendezVous";

/** Regroupe les rendez-vous par jour (clé AAAA-MM-JJ en Africa/Dakar). */
function jourDe(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Africa/Dakar" });
}

/** Libellé lisible d'un jour (ex. « lundi 8 septembre 2026 »). */
function libelleJour(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: "Africa/Dakar",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Agenda : les rendez-vous à venir (visite = un type), groupés par jour. Server
 * Component (RLS active). Filtre par type via l'URL. La création se fait via le
 * bouton, ou depuis une fiche bien/contact plus tard.
 */
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; passe?: string }>;
}) {
  const sp = await searchParams;
  const type =
    sp.type && sp.type in TYPE_RENDEZ_VOUS_LABELS
      ? (sp.type as TypeRendezVous)
      : undefined;
  const passe = sp.passe === "1";

  // Par défaut : à partir du début de la journée courante (Africa/Dakar).
  const aujourdhui = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Dakar",
  });
  const du = passe ? undefined : `${aujourdhui}T00:00:00`;

  const rows = await listRendezVous({ du, type });

  // Groupement par jour, en conservant l'ordre chronologique.
  const groupes: { jour: string; items: typeof rows }[] = [];
  for (const rdv of rows) {
    const j = jourDe(rdv.debut);
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.jour === j) dernier.items.push(rdv);
    else groupes.push({ jour: j, items: [rdv] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Agenda
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {rows.length} rendez-vous {passe ? "" : "à venir"}
          </p>
        </div>
        <Link
          href="/agenda/nouveau"
          className="flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau rendez-vous
        </Link>
      </div>

      {/* Filtres : type + à venir/tout */}
      <div className="flex flex-wrap gap-2 text-sm">
        <FiltreLien label="Tous types" actif={!type} href={hrefAvec({ passe }, {})} />
        {(Object.keys(TYPE_RENDEZ_VOUS_LABELS) as TypeRendezVous[]).map((t) => (
          <FiltreLien
            key={t}
            label={TYPE_RENDEZ_VOUS_LABELS[t]}
            actif={type === t}
            href={hrefAvec({ passe }, { type: t })}
          />
        ))}
        <span className="mx-1 w-px bg-zinc-200 dark:bg-zinc-700" />
        <FiltreLien label="À venir" actif={!passe} href={hrefAvec({ type }, {})} />
        <FiltreLien
          label="Tout l'historique"
          actif={passe}
          href={hrefAvec({ type }, { passe: true })}
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucun rendez-vous. Planifiez-en un.
        </div>
      ) : (
        <div className="space-y-6">
          {groupes.map((g) => (
            <div key={g.jour}>
              <h2 className="mb-2 text-sm font-medium capitalize text-zinc-500 dark:text-zinc-400">
                {libelleJour(g.jour)}
              </h2>
              <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {g.items.map((rdv) => (
                  <Link
                    key={rdv.id}
                    href={`/agenda/${rdv.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <div className="w-14 shrink-0 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {formatHeure(rdv.debut)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {rdv.titre}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {TYPE_RENDEZ_VOUS_LABELS[rdv.type]}
                        </span>
                        <BadgeStatutRendezVous statut={rdv.statut} />
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {rdv.contactNom && (
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" aria-hidden="true" />
                            {rdv.contactNom}
                          </span>
                        )}
                        {rdv.bienReference && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" aria-hidden="true" />
                            {rdv.bienReference}
                          </span>
                        )}
                        {rdv.lieu && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {rdv.lieu}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Construit un href /agenda en conservant certains filtres. */
function hrefAvec(
  garder: { type?: string; passe?: boolean },
  ajout: { type?: string; passe?: boolean }
): string {
  const p = new URLSearchParams();
  const type = ajout.type ?? garder.type;
  const passe = ajout.passe ?? garder.passe;
  if (type) p.set("type", type);
  if (passe) p.set("passe", "1");
  const qs = p.toString();
  return qs ? `/agenda?${qs}` : "/agenda";
}

function FiltreLien({
  label,
  actif,
  href,
}: {
  label: string;
  actif: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md border px-3 py-1.5 font-medium transition-colors ${
        actif
          ? "border-blue-700 bg-blue-900 text-white"
          : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      }`}
    >
      {label}
    </Link>
  );
}
