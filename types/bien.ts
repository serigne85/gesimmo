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
  | "archive"
  | "perdu"
  | "a_relancer";

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
  perdu: "Perdu",
  a_relancer: "À relancer",
};

/**
 * Statuts proposés au moment de la création d'un bien (dans l'ordre voulu).
 * Les autres statuts (sous_offre, suspendu, archive) restent atteignables plus
 * tard via la machine à états, sur la fiche du bien.
 */
export const STATUTS_CREATION_BIEN: StatutBien[] = [
  "prospecte",
  "disponible",
  "sous_mandat",
  "vendu",
  "loue",
  "perdu",
  "a_relancer",
];

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
  titre: string | null;
  type: TypeBien;
  objectif: ObjectifBien;
  statut: StatutBien;
  zoneNom: string | null;
  villeNom: string | null;
  prix: number | null;
  proprietaireNom: string;
  proprietaireTelephone: string;
  photoPrincipaleUrl: string | null;
};

/** Valeurs brutes d'un bien pour pré-remplir le formulaire d'édition. */
export type BienEdition = {
  id: string;
  reference: string;
  titre: string | null;
  type: TypeBien;
  objectif: ObjectifBien;
  villeId: string;
  zoneId: string;
  adresse: string | null;
  nombreChambres: number | null;
  surface: number | null; // en m²
  statutJuridique: StatutJuridique | null;
  prix: number | null;
  description: string | null;
  videoUrl: string | null;
};

/** Fiche détail complète d'un bien (avec libellés et propriétaire joints). */
export type BienDetail = {
  id: string;
  reference: string;
  titre: string | null;
  type: TypeBien;
  objectif: ObjectifBien;
  statut: StatutBien;
  dateRelance: string | null;
  statutJuridique: StatutJuridique | null;
  prix: number | null;
  description: string | null;
  videoUrl: string | null;
  adresse: string | null;
  nombreChambres: number | null;
  surface: number | null; // en m²
  zoneNom: string | null;
  villeNom: string | null;
  proprietaireNom: string;
  proprietaireTelephone: string;
  contactNom: string | null;
  contactTelephone: string | null;
  creeLe: string;
};
