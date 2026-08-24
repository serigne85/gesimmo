export type TypeBien =
  | "appartement"
  | "maison"
  | "villa"
  | "terrain"
  | "bureau"
  | "commerce"
  | "magasin"
  | "immeuble"
  | "studio"
  | "chambre"
  | "autre";

export type ObjectifBien = "vente" | "location";

export type StatutBien =
  | "prospecte"
  | "sous_mandat"
  | "disponible"
  | "sous_offre"
  | "vendu"
  | "loue"
  | "suspendu"
  | "archive";

export type StatutJuridique =
  | "titre_foncier"
  | "bail"
  | "deliberation"
  | "acte_notarie"
  | "non_titre";

/** Listes ordonnées (pour les listes déroulantes). */
export const TYPES_BIEN: TypeBien[] = [
  "appartement",
  "maison",
  "villa",
  "terrain",
  "bureau",
  "commerce",
  "magasin",
  "immeuble",
  "studio",
  "chambre",
  "autre",
];

export const STATUTS_JURIDIQUES: StatutJuridique[] = [
  "titre_foncier",
  "bail",
  "deliberation",
  "acte_notarie",
  "non_titre",
];

/** Libellés français pour l'interface. */
export const TYPE_BIEN_LABELS: Record<TypeBien, string> = {
  appartement: "Appartement",
  maison: "Maison",
  villa: "Villa",
  terrain: "Terrain",
  bureau: "Bureau",
  commerce: "Commerce",
  magasin: "Magasin",
  immeuble: "Immeuble",
  studio: "Studio",
  chambre: "Chambre",
  autre: "Autre",
};

export const OBJECTIF_LABELS: Record<ObjectifBien, string> = {
  vente: "Vente",
  location: "Location",
};

export const STATUT_BIEN_LABELS: Record<StatutBien, string> = {
  prospecte: "Prospecté",
  sous_mandat: "Sous mandat",
  disponible: "Disponible",
  sous_offre: "Sous offre",
  vendu: "Vendu",
  loue: "Loué",
  suspendu: "Suspendu",
  archive: "Archivé",
};

export const STATUT_JURIDIQUE_LABELS: Record<StatutJuridique, string> = {
  titre_foncier: "Titre foncier",
  bail: "Bail",
  deliberation: "Délibération",
  acte_notarie: "Acte notarié",
  non_titre: "Non titré",
};

/** Une ligne de la liste des biens (avec libellés joints). */
export type BienListe = {
  id: string;
  reference: string;
  type: TypeBien;
  objectif: ObjectifBien;
  statut: StatutBien;
  zoneNom: string | null;
  villeNom: string | null;
  prix: number | null;
  proprietaireNom: string;
  proprietaireTelephone: string;
};

/** Fiche détail complète d'un bien (avec libellés et propriétaire joints). */
export type BienDetail = {
  id: string;
  reference: string;
  type: TypeBien;
  objectif: ObjectifBien;
  statut: StatutBien;
  statutJuridique: StatutJuridique | null;
  prix: number | null;
  description: string | null;
  zoneNom: string | null;
  villeNom: string | null;
  proprietaireNom: string;
  proprietaireTelephone: string;
  creeLe: string;
};
