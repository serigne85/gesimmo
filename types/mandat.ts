import type { TypeBien, StatutJuridique } from "@/types/bien";

export type TypeMandat = "vente" | "location" | "gerance";

export type StatutMandat =
  | "brouillon"
  | "en_attente_signature"
  | "actif"
  | "expire"
  | "resilie"
  | "archive";

/** Unité de la rémunération de l'agence sur un mandat. */
export type CommissionUnite = "pourcentage" | "mois" | "montant";

export const TYPES_MANDAT: TypeMandat[] = ["vente", "location", "gerance"];

export const TYPE_MANDAT_LABELS: Record<TypeMandat, string> = {
  vente: "Vente",
  location: "Location",
  gerance: "Gérance",
};

export const STATUT_MANDAT_LABELS: Record<StatutMandat, string> = {
  brouillon: "Brouillon",
  en_attente_signature: "En attente de signature",
  actif: "Actif",
  expire: "Expiré",
  resilie: "Résilié",
  archive: "Archivé",
};

export const COMMISSION_UNITES: CommissionUnite[] = [
  "pourcentage",
  "mois",
  "montant",
];

export const COMMISSION_UNITE_LABELS: Record<CommissionUnite, string> = {
  pourcentage: "% du prix",
  mois: "mois de loyer",
  montant: "montant fixe (FCFA)",
};

/** Rémunération lisible : « 5 % », « 2 mois » ou un montant en FCFA. */
export function formatCommission(
  valeur: number | null,
  unite: CommissionUnite | null
): string {
  if (valeur === null || !unite) return "—";
  if (unite === "pourcentage") return `${valeur} %`;
  if (unite === "mois") return `${valeur} mois`;
  return `${valeur.toLocaleString("fr-FR")} FCFA`;
}

/** Une ligne de la liste des mandats (avec libellés joints). */
export type MandatListe = {
  id: string;
  reference: string;
  type: TypeMandat;
  statut: StatutMandat;
  exclusif: boolean;
  dateDebut: string | null;
  dateFin: string | null;
  bienReference: string;
  bienTitre: string | null;
  mandantNom: string;
  commissionValeur: number | null;
  commissionUnite: CommissionUnite | null;
};

/** Un bien proposé au choix lors de la création d'un mandat. Porte de quoi
 *  pré-remplir le mandant et appliquer la règle « vente ⇒ statut juridique ». */
export type BienSelectionnable = {
  id: string;
  reference: string;
  titre: string | null;
  type: TypeBien;
  objectif: "vente" | "location";
  statutJuridique: StatutJuridique | null;
  proprietaireNom: string;
};
