import type { StatutBien } from "@/types/bien";
import type { TypeMandat } from "@/types/mandat";
import type { TypeRendezVous } from "@/types/rendez-vous";

/** Un compteur du portefeuille pour un statut du cycle de vie. */
export type CompteurStatut = {
  statut: StatutBien;
  label: string;
  nombre: number;
};

/** Un mandat actif dont l'échéance approche (ou est dépassée). */
export type MandatExpirant = {
  id: string;
  reference: string;
  type: TypeMandat;
  dateFin: string | null;
  /** Jours avant expiration ; négatif si déjà dépassée. */
  joursRestants: number;
  bienReference: string;
  bienTitre: string | null;
};

/** Un rendez-vous du jour, réduit à l'essentiel affiché. */
export type RdvJour = {
  id: string;
  titre: string;
  type: TypeRendezVous;
  debut: string;
  contactNom: string | null;
  bienReference: string | null;
};

/**
 * Vue agrégée du tableau de bord opérationnel. Tout est calculé côté serveur ;
 * la page ne fait qu'afficher.
 */
export type TableauDeBord = {
  /** Compteurs du portefeuille par statut (cycle de vie). */
  portefeuille: {
    total: number;
    compteurs: CompteurStatut[];
  };
  /** Indicateurs actionnables : ce qui demande une action aujourd'hui. */
  alertes: {
    /** Biens disponibles créés il y a plus de SEUIL_DORMANT_JOURS jours. */
    biensDormants: number;
    /** Mandats actifs expirant sous HORIZON_EXPIRATION_JOURS jours (ou dépassés). */
    mandatsExpirant: number;
    /** Nombre d'échéances de loyer en retard ce mois-ci. */
    loyersRetardNb: number;
    /** Montant restant dû sur les échéances en retard ce mois-ci. */
    loyersRetardMontant: number;
    /** Tâches non terminées dont l'échéance est passée. */
    tachesEnRetard: number;
  };
  /** Loyers du mois courant (dû / encaissé / reste). */
  loyersMois: {
    mois: string;
    du: number;
    encaisse: number;
    reste: number;
  };
  /** Prospection terrain : pistes à travailler. */
  prospection: {
    /** Prospects « à relancer » dont la relance est due (date passée ou du jour). */
    aRelancer: number;
    /** Prospects marqués disponibles (pistes à transformer en biens). */
    disponibles: number;
    /** Total des prospections vivantes. */
    total: number;
  };
  /** Mandats à renouveler bientôt (les plus urgents en tête). */
  mandatsExpirantListe: MandatExpirant[];
  /** Rendez-vous et visites du jour. */
  rdvAujourdhui: RdvJour[];
};

/** Un bien est réputé « dormant » s'il est disponible depuis plus de N jours. */
export const SEUIL_DORMANT_JOURS = 60;
/** Fenêtre d'alerte sur l'expiration des mandats actifs. */
export const HORIZON_EXPIRATION_JOURS = 30;

/**
 * Ordre d'affichage des compteurs du portefeuille : les statuts « actifs » du
 * portefeuille d'abord, les statuts terminaux/inertes ensuite.
 */
export const ORDRE_STATUTS_PORTEFEUILLE: StatutBien[] = [
  "disponible",
  "sous_offre",
  "sous_mandat",
  "prospecte",
  "a_relancer",
  "loue",
  "vendu",
  "suspendu",
  "perdu",
  "archive",
];
