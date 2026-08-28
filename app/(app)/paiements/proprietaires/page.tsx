import Link from "next/link";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import {
  getProprietairesAvecBaux,
  getSituationProprietaire,
} from "@/services/situations";
import { moisCourant, moisPrecedent, moisSuivant } from "@/types/suivi";
import { formatFcfa, formatMois } from "@/lib/utils/format";
import OngletsPaiements from "@/components/metier/OngletsPaiements";
import SelecteurProprietaire from "@/components/metier/SelecteurProprietaire";
import BoutonPartagerSituation from "@/components/metier/BoutonPartagerSituation";

/**
 * Situation locative par propriétaire : récapitulatif d'un mois, une ligne par
 * locataire (un propriétaire peut avoir plusieurs biens), avec loyers encaissés
 * et montants reversés. Server Component ; l'état (propriétaire, mois) vit dans
 * l'URL. Le PDF et le partage arriveront à l'étape suivante.
 */
export default async function SituationProprietairePage({
  searchParams,
}: {
  searchParams: Promise<{ proprietaire?: string; mois?: string }>;
}) {
  const { proprietaire, mois: moisParam } = await searchParams;
  const mois = /^\d{4}-\d{2}$/.test(moisParam ?? "") ? moisParam! : moisCourant();

  const proprietaires = await getProprietairesAvecBaux();
  const situation = proprietaire
    ? await getSituationProprietaire(proprietaire, mois)
    : null;

  const lienMois = (m: string) => {
    const params = new URLSearchParams({ mois: m });
    if (proprietaire) params.set("proprietaire", proprietaire);
    return `/paiements/proprietaires?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Suivi des loyers
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Situation par propriétaire
        </p>
      </div>

      <OngletsPaiements actif="proprietaires" />

      {/* Sélecteur + navigation mois */}
      <div className="flex flex-wrap items-center gap-3">
        <SelecteurProprietaire
          proprietaires={proprietaires}
          valeur={proprietaire ?? null}
          mois={mois}
        />
        <div className="flex items-center gap-3">
          <Link
            href={lienMois(moisPrecedent(mois))}
            className="rounded-md border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            title="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <span className="min-w-40 text-center text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">
            {formatMois(`${mois}-01`)}
          </span>
          <Link
            href={lienMois(moisSuivant(mois))}
            className="rounded-md border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            title="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {!situation ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Choisissez un propriétaire pour afficher sa situation.
        </div>
      ) : situation.lignes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucun loyer ni reversement pour {situation.proprietaireNom} sur ce mois.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-medium">{situation.proprietaireNom}</span> ·{" "}
              {situation.lignes.length} bien
              {situation.lignes.length > 1 ? "s" : ""} loué
              {situation.lignes.length > 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <a
                href={`/api/proprietaires/${situation.proprietaireId}/situation?mois=${mois}`}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Télécharger PDF
              </a>
              <BoutonPartagerSituation
                url={`/api/proprietaires/${situation.proprietaireId}/situation?mois=${mois}`}
                filename={`situation-${mois}.pdf`}
                titre={`Situation locative ${formatMois(`${mois}-01`)}`}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Locataire</th>
                  <th className="px-3 py-2">Bien</th>
                  <th className="px-3 py-2 text-right">Loyer dû</th>
                  <th className="px-3 py-2 text-right">Encaissé</th>
                  <th className="px-3 py-2 text-right">Commission</th>
                  <th className="px-3 py-2 text-right">Reversé</th>
                  <th className="px-3 py-2 text-right">Reste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {situation.lignes.map((l) => (
                  <tr key={l.bailId} className="text-zinc-900 dark:text-zinc-100">
                    <td className="px-3 py-2">{l.locataireNom}</td>
                    <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400">
                      {l.bienReference}
                      {l.bienTitre ? ` · ${l.bienTitre}` : ""}
                    </td>
                    <td className="px-3 py-2 text-right">{formatFcfa(l.loyerDu)}</td>
                    <td className="px-3 py-2 text-right">{formatFcfa(l.encaisse)}</td>
                    <td className="px-3 py-2 text-right">{formatFcfa(l.commission)}</td>
                    <td className="px-3 py-2 text-right font-medium text-green-700 dark:text-green-400">
                      {formatFcfa(l.reverse)}
                    </td>
                    <td className="px-3 py-2 text-right">{formatFcfa(l.reste)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-zinc-300 bg-zinc-50 font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                <tr>
                  <td className="px-3 py-2" colSpan={2}>
                    Total
                  </td>
                  <td className="px-3 py-2 text-right">{formatFcfa(situation.totaux.loyerDu)}</td>
                  <td className="px-3 py-2 text-right">{formatFcfa(situation.totaux.encaisse)}</td>
                  <td className="px-3 py-2 text-right">{formatFcfa(situation.totaux.commission)}</td>
                  <td className="px-3 py-2 text-right text-green-700 dark:text-green-400">
                    {formatFcfa(situation.totaux.reverse)}
                  </td>
                  <td className="px-3 py-2 text-right">{formatFcfa(situation.totaux.reste)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
