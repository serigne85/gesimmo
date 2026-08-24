/** Formate un montant en FCFA (séparateur d'espace, sans décimale). */
export function formatFcfa(montant: number | null | undefined): string {
  if (montant === null || montant === undefined) return "—";
  return `${montant.toLocaleString("fr-FR")} FCFA`;
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
