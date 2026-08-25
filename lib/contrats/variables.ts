/**
 * Variables disponibles dans les modèles de contrat de mandat. On les écrit
 * `{{cle}}` dans le corps du modèle ; elles sont remplacées par les données du
 * mandat / bien / mandant à la génération du PDF (étape suivante).
 *
 * Source unique : l'éditeur de modèles affiche cette liste, et la génération
 * s'appuiera sur les mêmes clés — pas de divergence possible.
 */
export type VariableContrat = { cle: string; description: string };

export const VARIABLES_CONTRAT: VariableContrat[] = [
  { cle: "reference_mandat", description: "Référence du mandat" },
  { cle: "date_du_jour", description: "Date de génération du document" },
  { cle: "agence_nom", description: "Nom de l'agence" },
  { cle: "mandant_nom", description: "Nom du mandant (propriétaire)" },
  { cle: "mandant_telephone", description: "Téléphone du mandant" },
  { cle: "bien_reference", description: "Référence du bien" },
  { cle: "bien_titre", description: "Titre du bien" },
  { cle: "bien_type", description: "Type de bien" },
  { cle: "bien_adresse", description: "Adresse du bien" },
  { cle: "bien_zone", description: "Zone" },
  { cle: "bien_ville", description: "Ville" },
  { cle: "bien_prix", description: "Prix de vente ou loyer (FCFA)" },
  { cle: "bien_statut_juridique", description: "Statut juridique du bien" },
  { cle: "commission", description: "Rémunération de l'agence" },
  { cle: "date_effet", description: "Date d'effet (début du mandat)" },
  { cle: "date_fin", description: "Date de fin du mandat" },
  { cle: "duree", description: "Durée du mandat" },
  { cle: "exclusivite", description: "Mandat exclusif ou simple" },
];
