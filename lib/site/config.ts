/**
 * Coordonnées publiques de l'agence — source unique pour tout le site vitrine.
 *
 * Ces valeurs alimentent l'en-tête, le pied de page et les boutons de contact.
 * Les champs marqués « À COMPLÉTER » contiennent des valeurs d'exemple : il faut
 * les remplacer par les vraies coordonnées de M2S IMMO avant la mise en ligne.
 */
export const AGENCE = {
  nom: "M2S IMMO",
  slogan: "L'immobilier à Dakar, en toute confiance.",

  // Téléphone fixe affiché (format lisible).
  telephone: "+221 33 833 18 34",

  // Téléphone portable affiché (format lisible).
  mobile: "+221 77 739 93 93",

  // Numéro WhatsApp au format international SANS le "+", pour les liens wa.me.
  // = le portable (77 739 93 93 → 221 777 39 93 93).
  whatsapp: "221777399393",

  email: "contact@m2simmo.com",
  adresse: "Castors 3, Bargny – Dakar",

  // Réseaux sociaux (URL complètes). Laisser vide ("") pour masquer le lien.
  facebook: "",
  instagram: "",
} as const;

/**
 * URL de base publique du site (sans slash final). Sert à construire les liens
 * absolus nécessaires au partage et aux aperçus Open Graph. En production,
 * définir NEXT_PUBLIC_SITE_URL (ex. "https://m2simmo.com") dans les variables
 * d'environnement Vercel ; en local, on retombe sur http://localhost:3000.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
