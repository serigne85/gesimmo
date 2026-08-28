/** Formate un montant en FCFA (séparateur d'espace, sans décimale). */
export function formatFcfa(montant: number | null | undefined): string {
  if (montant === null || montant === undefined) return "—";
  return `${montant.toLocaleString("fr-FR")} FCFA`;
}

/** Formate une date en Africa/Dakar (JJ/MM/AAAA). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: "Africa/Dakar",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Formate un mois en Africa/Dakar (« septembre 2026 »). */
export function formatMois(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: "Africa/Dakar",
    month: "long",
    year: "numeric",
  });
}

/** Lien d'appel téléphonique. */
export function telHref(telephone: string): string {
  return `tel:${telephone.replace(/\s/g, "")}`;
}

/**
 * Lien WhatsApp. On garde les chiffres ; un numéro sénégalais local à 9 chiffres
 * (commençant par 7) est préfixé de l'indicatif 221.
 */
export function whatsappHref(telephone: string): string {
  let digits = telephone.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("7")) {
    digits = `221${digits}`;
  }
  return `https://wa.me/${digits}`;
}
