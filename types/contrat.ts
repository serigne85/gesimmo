import type { TypeMandat, CommissionUnite } from "@/types/mandat";
import type { TypeBien, StatutJuridique } from "@/types/bien";

/** Données complètes nécessaires pour générer le contrat d'un mandat. */
export type MandatContrat = {
  id: string;
  reference: string;
  type: TypeMandat;
  exclusif: boolean;
  dateDebut: string | null;
  dateFin: string | null;
  commissionValeur: number | null;
  commissionUnite: CommissionUnite | null;
  /** Texte déjà enregistré (retouché), ou null si jamais généré. */
  contratTexte: string | null;
  contratMajLe: string | null;
  bien: {
    reference: string;
    titre: string | null;
    type: TypeBien;
    adresse: string | null;
    zoneNom: string | null;
    villeNom: string | null;
    prix: number | null;
    statutJuridique: StatutJuridique | null;
  };
  mandant: {
    nomComplet: string;
    telephone: string;
    dateNaissance: string | null;
    lieuNaissance: string | null;
    cni: string | null;
  };
  agenceNom: string;
  /** Modèle de contrat de l'agence pour cette nature (titre + corps à trous). */
  modeleTitre: string;
  modeleCorps: string;
};
