import "server-only";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { SituationProprietaire } from "@/types/situation";
import { formatMois } from "@/lib/utils/format";

/** Montant compact pour les cellules (séparateur d'espace, sans « FCFA »). */
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
    marginBottom: 12,
  },
  agence: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  ville: { fontSize: 9, color: "#71717a", marginTop: 2 },
  titre: { fontSize: 12, fontFamily: "Helvetica-Bold", textAlign: "right" },
  mois: { fontSize: 9, color: "#71717a", textAlign: "right", marginTop: 2 },
  proprio: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  sousTitre: { fontSize: 9, color: "#71717a", marginBottom: 10 },

  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e4e4e7" },
  head: { backgroundColor: "#f4f4f5", fontFamily: "Helvetica-Bold" },
  total: {
    backgroundColor: "#f4f4f5",
    fontFamily: "Helvetica-Bold",
    borderTopWidth: 1.5,
    borderTopColor: "#a1a1aa",
  },
  cell: { paddingVertical: 5, paddingHorizontal: 4 },
  cLocataire: { width: "20%" },
  cBien: { width: "22%" },
  cNum: { width: "11.6%", textAlign: "right" },

  note: { fontSize: 8, color: "#71717a", marginTop: 12 },
  pied: { fontSize: 8, color: "#a1a1aa", marginTop: 24, textAlign: "right" },
});

type PdfStyle = (typeof styles)[keyof typeof styles];

/** Une cellule de texte. */
function C({ style, children }: { style?: PdfStyle; children: React.ReactNode }) {
  return <Text style={style ? [styles.cell, style] : styles.cell}>{children}</Text>;
}

/** Document PDF de la situation locative d'un propriétaire. */
function SituationDoc({
  situation,
  agenceNom,
  agenceVille,
}: {
  situation: SituationProprietaire;
  agenceNom: string;
  agenceVille: string | null;
}) {
  const t = situation.totaux;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.agence}>{agenceNom}</Text>
            {agenceVille ? <Text style={styles.ville}>{agenceVille}</Text> : null}
          </View>
          <View>
            <Text style={styles.titre}>SITUATION LOCATIVE</Text>
            <Text style={styles.mois}>{formatMois(`${situation.mois}-01`)}</Text>
          </View>
        </View>

        <Text style={styles.proprio}>{situation.proprietaireNom}</Text>
        <Text style={styles.sousTitre}>
          {situation.lignes.length} bien{situation.lignes.length > 1 ? "s" : ""} loué
          {situation.lignes.length > 1 ? "s" : ""} · montants en FCFA
        </Text>

        {/* En-tête du tableau */}
        <View style={[styles.row, styles.head]}>
          <C style={styles.cLocataire}>Locataire</C>
          <C style={styles.cBien}>Bien</C>
          <C style={styles.cNum}>Loyer dû</C>
          <C style={styles.cNum}>Encaissé</C>
          <C style={styles.cNum}>Commission</C>
          <C style={styles.cNum}>Reversé</C>
          <C style={styles.cNum}>Reste</C>
        </View>

        {/* Lignes */}
        {situation.lignes.map((l) => (
          <View key={l.bailId} style={styles.row} wrap={false}>
            <C style={styles.cLocataire}>{l.locataireNom}</C>
            <C style={styles.cBien}>
              {l.bienReference}
              {l.bienTitre ? ` · ${l.bienTitre}` : ""}
            </C>
            <C style={styles.cNum}>{n(l.loyerDu)}</C>
            <C style={styles.cNum}>{n(l.encaisse)}</C>
            <C style={styles.cNum}>{n(l.commission)}</C>
            <C style={styles.cNum}>{n(l.reverse)}</C>
            <C style={styles.cNum}>{n(l.reste)}</C>
          </View>
        ))}

        {/* Totaux */}
        <View style={[styles.row, styles.total]}>
          <C style={styles.cLocataire}>Total</C>
          <C style={styles.cBien}> </C>
          <C style={styles.cNum}>{n(t.loyerDu)}</C>
          <C style={styles.cNum}>{n(t.encaisse)}</C>
          <C style={styles.cNum}>{n(t.commission)}</C>
          <C style={styles.cNum}>{n(t.reverse)}</C>
          <C style={styles.cNum}>{n(t.reste)}</C>
        </View>

        <Text style={styles.note}>
          Encaissé : loyers perçus des locataires. Reversé : montant net versé au
          propriétaire. Reste : encaissé non encore reversé.
        </Text>

        <Text style={styles.pied}>
          Document généré par {agenceNom} — {formatMois(`${situation.mois}-01`)}
        </Text>
      </Page>
    </Document>
  );
}

/** Rend la situation en buffer PDF (côté serveur, runtime Node). */
export async function renderSituationPdf(
  situation: SituationProprietaire,
  agence: { nom: string; ville: string | null }
): Promise<Buffer> {
  return renderToBuffer(
    <SituationDoc
      situation={situation}
      agenceNom={agence.nom}
      agenceVille={agence.ville}
    />
  );
}
