"use client";

import { Printer } from "lucide-react";

/**
 * Bouton d'impression (utilise la boîte d'impression du navigateur). Masqué à
 * l'impression via `print:hidden` pour ne pas figurer sur le reçu papier.
 */
export default function BoutonImprimer() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 print:hidden"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      Imprimer
    </button>
  );
}
