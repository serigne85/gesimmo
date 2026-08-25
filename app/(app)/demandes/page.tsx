import Link from "next/link";
import { Plus } from "lucide-react";
import { listDemandes, DEMANDES_PAGE_SIZE } from "@/services/demandes";
import { listZones } from "@/services/reference";
import { getUtilisateurConnecte } from "@/services/auth";
import { TYPES_BIEN } from "@/types/bien";
import type { TypeBien } from "@/types/bien";
import {
  OBJECTIF_DEMANDE_LABELS,
  STATUT_DEMANDE_LABELS,
  type ObjectifDemande,
  type StatutDemande,
} from "@/types/demande";
import FiltresDemandes from "@/components/metier/FiltresDemandes";
import TableauDemandes from "@/components/metier/TableauDemandes";

/**
 * Liste des demandes clients. Server Component : données chargées côté serveur
 * (RLS active), présentées en lignes bordées. Filtres et pagination via l'URL,
 * donc le filtrage est fait en base, pas dans le navigateur.
 */
export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    objectif?: string;
    statut?: string;
    zone?: string;
    type?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  // On ne retient que des valeurs connues (défense côté serveur).
  const objectif =
    sp.objectif && sp.objectif in OBJECTIF_DEMANDE_LABELS
      ? (sp.objectif as ObjectifDemande)
      : undefined;
  const statut =
    sp.statut && sp.statut in STATUT_DEMANDE_LABELS
      ? (sp.statut as StatutDemande)
      : undefined;
  const type = TYPES_BIEN.includes(sp.type as TypeBien)
    ? (sp.type as TypeBien)
    : undefined;
  const zoneId = sp.zone || undefined;

  const [zones, { rows, total }, profil] = await Promise.all([
    listZones(),
    listDemandes(page, { objectif, statut, zoneId, type }),
    getUtilisateurConnecte(),
  ]);
  const nbPages = Math.max(1, Math.ceil(total / DEMANDES_PAGE_SIZE));
  const estAdmin = profil?.role === "admin";
  const aujourdhui = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Dakar",
  });

  // Chaîne de paramètres pour conserver les filtres dans la pagination.
  const paramsBase = new URLSearchParams();
  if (objectif) paramsBase.set("objectif", objectif);
  if (statut) paramsBase.set("statut", statut);
  if (zoneId) paramsBase.set("zone", zoneId);
  if (type) paramsBase.set("type", type);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Demandes
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {total} demande{total > 1 ? "s" : ""} client{total > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/demandes/nouveau"
          className="flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvelle demande
        </Link>
      </div>

      <FiltresDemandes zones={zones} />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucune demande ne correspond. Modifiez les filtres ou enregistrez-en une.
        </div>
      ) : (
        <TableauDemandes
          demandes={rows}
          aujourdhui={aujourdhui}
          peutSupprimer={estAdmin}
        />
      )}

      {nbPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <PaginationLien
            page={page - 1}
            disabled={page <= 1}
            label="Précédent"
            paramsBase={paramsBase}
          />
          <span className="text-zinc-500 dark:text-zinc-400">
            Page {page} / {nbPages}
          </span>
          <PaginationLien
            page={page + 1}
            disabled={page >= nbPages}
            label="Suivant"
            paramsBase={paramsBase}
          />
        </div>
      )}
    </div>
  );
}

function PaginationLien({
  page,
  disabled,
  label,
  paramsBase,
}: {
  page: number;
  disabled: boolean;
  label: string;
  paramsBase: URLSearchParams;
}) {
  if (disabled) {
    return <span className="text-zinc-300 dark:text-zinc-700">{label}</span>;
  }
  const params = new URLSearchParams(paramsBase);
  params.set("page", String(page));
  return (
    <Link
      href={`/demandes?${params.toString()}`}
      className="rounded-md border border-zinc-300 px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {label}
    </Link>
  );
}
