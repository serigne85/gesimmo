import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getSituationsMois } from "@/services/situations";
import { moisCourant, moisPrecedent, moisSuivant } from "@/types/suivi";
import { MODE_PAIEMENT_LABELS } from "@/types/bail";
import {
  formatFcfa,
  formatMois,
  formatDate,
  telHref,
  whatsappHref,
} from "@/lib/utils/format";
import type { SituationProprietaire } from "@/types/situation";
import OngletsPaiements from "@/components/metier/OngletsPaiements";
import BoutonPartagerSituation from "@/components/metier/BoutonPartagerSituation";
import ReverserProprietaire from "@/components/metier/ReverserProprietaire";
import BoutonAnnulerReversementProprietaire from "@/components/metier/BoutonAnnulerReversementProprietaire";

/**
 * Reversements par propriétaire : pour un mois, la liste de tous les
 * propriétaires ayant un loyer encaissé (ou déjà reversé), avec leurs locataires,
 * le net à reverser, un bouton « Reverser » et l'indicateur « reversé / à faire ».
 * Server Component ; le mois vit dans l'URL (?mois=AAAA-MM).
 */
export default async function ReversementsProprietairesPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const { mois: moisParam } = await searchParams;
  const mois = /^\d{4}-\d{2}$/.test(moisParam ?? "") ? moisParam! : moisCourant();

  const situations = await getSituationsMois(mois);
  // Date du jour en Africa/Dakar (AAAA-MM-JJ) pour la date par défaut du formulaire.
  const aujourdhui = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Dakar",
  });

  // Totaux du mois.
  const totalNet = situations.reduce((s, x) => s + x.totaux.reverse, 0);
  const totalReverse = situations.reduce(
    (s, x) => s + (x.reversement?.montantReverse ?? 0),
    0
  );
  const aFaire = situations.filter((x) => !x.reversement);
  const resteAReverser = aFaire.reduce((s, x) => s + x.totaux.reverse, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Suivi des loyers
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Reversements par propriétaire
        </p>
      </div>

      <OngletsPaiements actif="proprietaires" />

      {/* Totaux du mois */}
      <div className="grid grid-cols-3 gap-3">
        <Tuile label="Net à reverser" valeur={formatFcfa(totalNet)} />
        <Tuile
          label="Déjà reversé"
          valeur={formatFcfa(totalReverse)}
          accent="text-green-700 dark:text-green-400"
        />
        <Tuile
          label={`Reste à traiter (${aFaire.length})`}
          valeur={formatFcfa(resteAReverser)}
          accent={resteAReverser > 0 ? "text-amber-600 dark:text-amber-400" : undefined}
        />
      </div>

      {/* Navigation par mois */}
      <div className="flex items-center gap-3">
        <Link
          href={`/paiements/proprietaires?mois=${moisPrecedent(mois)}`}
          className="rounded-md border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          title="Mois précédent"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <span className="min-w-40 text-center text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">
          {formatMois(`${mois}-01`)}
        </span>
        <Link
          href={`/paiements/proprietaires?mois=${moisSuivant(mois)}`}
          className="rounded-md border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          title="Mois suivant"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {situations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Aucun loyer encaissé ni reversement pour ce mois.
        </div>
      ) : (
        <div className="space-y-4">
          {situations.map((s) => (
            <SectionProprietaire
              key={s.proprietaireId}
              situation={s}
              mois={mois}
              aujourdhui={aujourdhui}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Une section par propriétaire : en-tête, locataires, net et action de reversement. */
function SectionProprietaire({
  situation: s,
  mois,
  aujourdhui,
}: {
  situation: SituationProprietaire;
  mois: string;
  aujourdhui: string;
}) {
  const rev = s.reversement;
  const pdfUrl = `/api/proprietaires/${s.proprietaireId}/situation?mois=${mois}`;

  return (
    <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {/* En-tête propriétaire */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <Link href={`/contacts/${s.proprietaireId}`} className="hover:underline">
              {s.proprietaireNom || "Propriétaire inconnu"}
            </Link>
            <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
              {s.lignes.length} bien{s.lignes.length > 1 ? "s" : ""}
            </span>
          </h2>
          {s.proprietaireTelephone && (
            <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              {s.proprietaireTelephone}
              <a
                href={telHref(s.proprietaireTelephone)}
                title={`Appeler ${s.proprietaireTelephone}`}
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-blue-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a
                href={whatsappHref(s.proprietaireTelephone)}
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
        <BadgeReversement reverse={!!rev} />
      </div>

      {/* Locataires du propriétaire */}
      {s.lignes.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Locataire</th>
                <th className="px-3 py-2">Bien</th>
                <th className="px-3 py-2 text-right">Encaissé</th>
                <th className="px-3 py-2 text-right">Commission</th>
                <th className="px-3 py-2 text-right">Net à reverser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {s.lignes.map((l) => (
                <tr key={l.bailId} className="text-zinc-900 dark:text-zinc-100">
                  <td className="px-3 py-2">{l.locataireNom}</td>
                  <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400">
                    {l.bienReference}
                    {l.bienTitre ? ` · ${l.bienTitre}` : ""}
                  </td>
                  <td className="px-3 py-2 text-right">{formatFcfa(l.encaisse)}</td>
                  <td className="px-3 py-2 text-right">{formatFcfa(l.commission)}</td>
                  <td className="px-3 py-2 text-right font-medium text-green-700 dark:text-green-400">
                    {formatFcfa(l.reverse)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-zinc-300 bg-zinc-50 font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              <tr>
                <td className="px-3 py-2" colSpan={2}>
                  Total à reverser
                </td>
                <td className="px-3 py-2 text-right">{formatFcfa(s.totaux.encaisse)}</td>
                <td className="px-3 py-2 text-right">{formatFcfa(s.totaux.commission)}</td>
                <td className="px-3 py-2 text-right text-green-700 dark:text-green-400">
                  {formatFcfa(s.totaux.reverse)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Action de reversement + partage */}
      <div className="flex flex-wrap items-center gap-2">
        {rev ? (
          <>
            <span className="text-sm text-zinc-600 dark:text-zinc-300">
              Reversé le {formatDate(rev.dateReversement)} —{" "}
              <span className="font-medium text-green-700 dark:text-green-400">
                {formatFcfa(rev.montantReverse)}
              </span>{" "}
              ({MODE_PAIEMENT_LABELS[rev.mode]})
            </span>
            <BoutonAnnulerReversementProprietaire id={rev.id} mois={mois} />
          </>
        ) : (
          <ReverserProprietaire
            proprietaireId={s.proprietaireId}
            mois={mois}
            encaisse={s.totaux.encaisse}
            commission={s.totaux.commission}
            aujourdhui={aujourdhui}
          />
        )}
        <a
          href={pdfUrl}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          PDF
        </a>
        <BoutonPartagerSituation
          url={pdfUrl}
          filename={`situation-${mois}.pdf`}
          titre={`Situation locative ${formatMois(`${mois}-01`)}`}
        />
      </div>
    </section>
  );
}

/** Indicateur « reversé / à faire ». */
function BadgeReversement({ reverse }: { reverse: boolean }) {
  if (reverse) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Reversé
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      À faire
    </span>
  );
}

/** Une tuile de total du mois. */
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
