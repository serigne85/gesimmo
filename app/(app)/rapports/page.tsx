import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { getUtilisateurConnecte } from "@/services/auth";
import { estAdminOuDirection } from "@/types/roles";
import { getRapports } from "@/services/rapports";
import {
  estMoisValide,
  periodeDefaut,
  type RapportPeriode,
} from "@/types/rapport";
import { formatFcfa, formatMois } from "@/lib/utils/format";
import SelecteurPeriodeRapport from "@/components/metier/SelecteurPeriodeRapport";
import CarteRepartition from "@/components/metier/CarteRepartition";

/**
 * Rapports de direction — réservé admin/direction (garde serveur, pas seulement
 * le masquage du menu). Server Component : toute l'agrégation vit dans le service.
 */
export default async function RapportsPage({
  searchParams,
}: {
  searchParams: Promise<{ debut?: string; fin?: string }>;
}) {
  const profil = await getUtilisateurConnecte();
  if (!profil || !estAdminOuDirection(profil.role)) {
    redirect("/tableau-de-bord");
  }

  const { debut, fin } = await searchParams;
  const periode = normaliserPeriode(debut, fin);
  const r = await getRapports(periode);

  const memeMois = periode.debut === periode.fin;
  const libellePeriode = memeMois
    ? formatMois(`${periode.debut}-01`)
    : `${formatMois(`${periode.debut}-01`)} – ${formatMois(`${periode.fin}-01`)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Rapports
          </h1>
          <p className="text-sm capitalize text-zinc-500 dark:text-zinc-400">
            {libellePeriode}
          </p>
        </div>
        <a
          href={`/api/rapports/pdf?debut=${periode.debut}&fin=${periode.fin}`}
          download
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Télécharger PDF
        </a>
      </div>

      <SelecteurPeriodeRapport periode={periode} />

      {/* Recouvrement + commissions : les chiffres de pilotage */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tuile label="Loyers dus (période)" valeur={formatFcfa(r.recouvrement.du)} />
        <Tuile
          label="Encaissés"
          valeur={formatFcfa(r.recouvrement.encaisse)}
          accent="text-green-700 dark:text-green-400"
        />
        <Tuile
          label={`Taux d'encaissement`}
          valeur={`${r.recouvrement.taux} %`}
          accent={
            r.recouvrement.taux < 100
              ? "text-amber-600 dark:text-amber-400"
              : "text-green-700 dark:text-green-400"
          }
        />
        <Tuile
          label={`Reste dû (${r.recouvrement.nbImpayees} impayée${r.recouvrement.nbImpayees > 1 ? "s" : ""})`}
          valeur={formatFcfa(r.recouvrement.reste)}
          accent={
            r.recouvrement.reste > 0 ? "text-red-600 dark:text-red-400" : undefined
          }
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Commissions encaissées
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Tuile label="Gérance" valeur={formatFcfa(r.commissions.gerance)} />
          <Tuile label="Apports d'affaires" valeur={formatFcfa(r.commissions.apports)} />
          <Tuile
            label="Total"
            valeur={formatFcfa(r.commissions.total)}
            accent="text-green-700 dark:text-green-400"
          />
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Hors commissions de vente et de location, non tracées comme encaissées
          en V1.
        </p>
      </section>

      {/* Activité sur la période */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Activité sur la période
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tuile label="Biens rentrés" valeur={String(r.activite.biensRentres)} />
          <Tuile label="Mandats signés" valeur={String(r.activite.mandatsSignes)} />
          <Tuile label="Baux enregistrés" valeur={String(r.activite.bauxEnregistres)} />
          <Tuile label="Visites réalisées" valeur={String(r.activite.visitesRealisees)} />
        </div>
      </section>

      {/* Composition du portefeuille (photo à l'instant présent) */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Portefeuille · {r.portefeuille.total} bien
          {r.portefeuille.total > 1 ? "s" : ""}{" "}
          <span className="font-normal text-zinc-400">(à aujourd&apos;hui)</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <CarteRepartition titre="Par objectif" lignes={r.portefeuille.parObjectif} total={r.portefeuille.total} />
          <CarteRepartition titre="Par statut" lignes={r.portefeuille.parStatut} total={r.portefeuille.total} />
          <CarteRepartition titre="Par type" lignes={r.portefeuille.parType} total={r.portefeuille.total} />
          <CarteRepartition titre="Par zone" lignes={r.portefeuille.parZone} total={r.portefeuille.total} />
        </div>
      </section>
    </div>
  );
}

/** Retient une période valide depuis l'URL, sinon la période par défaut. Réordonne si besoin. */
function normaliserPeriode(debut?: string, fin?: string): RapportPeriode {
  if (!estMoisValide(debut) || !estMoisValide(fin)) return periodeDefaut();
  return debut <= fin ? { debut, fin } : { debut: fin, fin: debut };
}

/** Tuile de chiffre simple. */
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
      <p className={`mt-1 text-sm font-semibold ${accent ?? "text-zinc-900 dark:text-zinc-100"}`}>
        {valeur}
      </p>
    </div>
  );
}

