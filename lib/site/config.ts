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

  // Téléphone affiché (format lisible). À COMPLÉTER.
  telephone: "+221 77 000 00 00",

  // Numéro WhatsApp au format international SANS le "+", pour les liens wa.me.
  // Ex. un numéro sénégalais 77 123 45 67 → "221771234567". À COMPLÉTER.
  whatsapp: "221770000000",

  email: "contact@m2simmo.sn", // À COMPLÉTER
  adresse: "Dakar, Sénégal", // À COMPLÉTER (rue / quartier)

  // Réseaux sociaux (URL complètes). Laisser vide ("") pour masquer le lien.
  facebook: "",
  instagram: "",
} as const;

/**
 * URL de base publique du site (sans slash final). Sert à construire les liens
 * absolus nécessaires au partage et aux aperçus Open Graph. En production,
 * définir NEXT_PUBLIC_SITE_URL (ex. "https://m2simmo.sn") dans les variables
 * d'environnement Vercel ; en local, on retombe sur http://localhost:3000.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
