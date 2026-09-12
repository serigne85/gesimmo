import "server-only";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Rapports, RepartitionLigne } from "@/types/rapport";
import { formatMois } from "@/lib/utils/format";

/** Montant compact (séparateur d'espace, sans « FCFA »). */
function n(v: number): string {
  return v.toLocaleString("fr-FR");
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: "#18181b", fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d8",
    paddingBottom: 8,
    marginBottom: 14,
  },
  agence: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  ville: { fontSize: 9, color: "#71717a", marginTop: 2 },
  titre: { fontSize: 12, fontFamily: "Helvetica-Bold", textAlign: "right" },
  periode: { fontSize: 9, color: "#71717a", textAlign: "right", marginTop: 2 },

  section: { marginBottom: 14 },
  sectionTitre: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: "#3f3f46",
  },

  // Rangée d'indicateurs (libellé + valeur)
  kpis: { flexDirection: "row", flexWrap: "wrap" },
  kpi: {
    width: "25%",
    borderWidth: 0.5,
    borderColor: "#e4e4e7",
    padding: 6,
  },
  kpiLabel: { fontSize: 8, color: "#71717a" },
  kpiValue: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 3 },

  // Grille des répartitions
  grille: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  carte: {
    width: "48%",
    borderWidth: 0.5,
    borderColor: "#e4e4e7",
    padding: 8,
    marginBottom: 10,
  },
  carteTitre: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#71717a", marginBottom: 5 },
  ligne: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  ligneLabel: { width: "70%" },
  ligneNombre: { width: "30%", textAlign: "right" },
  vide: { fontSize: 8, color: "#a1a1aa" },

  note: { fontSize: 8, color: "#71717a", marginTop: 4 },
  pied: { fontSize: 8, color: "#a1a1aa", marginTop: 20, textAlign: "right" },
});

type PdfStyle = (typeof styles)[keyof typeof styles];

/** Un indicateur (libellé + valeur). */
function Kpi({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{valeur}</Text>
    </View>
  );
}

/** Une carte de répartition (titre + lignes). */
function Carte({
  titre,
  lignes,
  total,
}: {
  titre: string;
  lignes: RepartitionLigne[];
  total: number;
}) {
  return (
    <View style={styles.carte}>
      <Text style={styles.carteTitre}>{titre}</Text>
      {lignes.length === 0 ? (
        <Text style={styles.vide}>Aucun bien.</Text>
      ) : (
        lignes.map((l) => {
          const part = total > 0 ? Math.round((l.nombre / total) * 100) : 0;
          return (
            <View key={l.cle} style={styles.ligne}>
              <Text style={styles.ligneLabel as PdfStyle}>{l.label}</Text>
              <Text style={styles.ligneNombre as PdfStyle}>
                {l.nombre} ({part} %)
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

/** Document PDF du rapport d'activité pour une période. */
function RapportDoc({
  rapports,
  agenceNom,
  agenceVille,
}: {
  rapports: Rapports;
  agenceNom: string;
  agenceVille: string | null;
}) {
  const { periode, recouvrement, commissions, activite, portefeuille } = rapports;
  const memeMois = periode.debut === periode.fin;
  const libellePeriode = memeMois
    ? formatMois(`${periode.debut}-01`)
    : `${formatMois(`${periode.debut}-01`)} – ${formatMois(`${periode.fin}-01`)}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.agence}>{agenceNom}</Text>
            {agenceVille ? <Text style={styles.ville}>{agenceVille}</Text> : null}
          </View>
          <View>
            <Text style={styles.titre}>RAPPORT D&apos;ACTIVITÉ</Text>
            <Text style={styles.periode}>{libellePeriode}</Text>
          </View>
        </View>

        {/* Recouvrement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>Recouvrement locatif · montants en FCFA</Text>
          <View style={styles.kpis}>
            <Kpi label="Loyers dus" valeur={n(recouvrement.du)} />
            <Kpi label="Encaissés" valeur={n(recouvrement.encaisse)} />
            <Kpi label="Taux d'encaissement" valeur={`${recouvrement.taux} %`} />
            <Kpi
              label={`Reste dû (${recouvrement.nbImpayees} impayée${recouvrement.nbImpayees > 1 ? "s" : ""})`}
              valeur={n(recouvrement.reste)}
            />
          </View>
        </View>

        {/* Commissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>Commissions encaissées · montants en FCFA</Text>
          <View style={styles.kpis}>
            <Kpi label="Gérance" valeur={n(commissions.gerance)} />
            <Kpi label="Apports d'affaires" valeur={n(commissions.apports)} />
            <Kpi label="Total" valeur={n(commissions.total)} />
          </View>
          <Text style={styles.note}>
            Hors commissions de vente et de location, non tracées comme encaissées en V1.
          </Text>
        </View>

        {/* Activité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>Activité sur la période</Text>
          <View style={styles.kpis}>
            <Kpi label="Biens rentrés" valeur={String(activite.biensRentres)} />
            <Kpi label="Mandats signés" valeur={String(activite.mandatsSignes)} />
            <Kpi label="Baux enregistrés" valeur={String(activite.bauxEnregistres)} />
            <Kpi label="Visites réalisées" valeur={String(activite.visitesRealisees)} />
          </View>
        </View>

        {/* Portefeuille */}
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>
            Portefeuille · {portefeuille.total} bien
            {portefeuille.total > 1 ? "s" : ""} (à aujourd&apos;hui)
          </Text>
          <View style={styles.grille}>
            <Carte titre="Par objectif" lignes={portefeuille.parObjectif} total={portefeuille.total} />
            <Carte titre="Par statut" lignes={portefeuille.parStatut} total={portefeuille.total} />
            <Carte titre="Par type" lignes={portefeuille.parType} total={portefeuille.total} />
            <Carte titre="Par zone" lignes={portefeuille.parZone} total={portefeuille.total} />
          </View>
        </View>

        <Text style={styles.pied}>
          Document généré par {agenceNom} — {libellePeriode}
        </Text>
      </Page>
    </Document>
  );
}

/** Rend le rapport en buffer PDF (côté serveur, runtime Node). */
export async function renderRapportPdf(
  rapports: Rapports,
  agence: { nom: string; ville: string | null }
): Promise<Buffer> {
  return renderToBuffer(
    <RapportDoc rapports={rapports} agenceNom={agence.nom} agenceVille={agence.ville} />
  );
}
