"use client";

import { useState } from "react";
import { MessageCircle, Link2, Check, Share2 } from "lucide-react";

/**
 * Boutons de partage d'un bien : WhatsApp, Facebook, X, et « copier le lien ».
 * Composant client (le presse-papiers et l'état « copié » nécessitent le
 * navigateur). Les liens de partage s'ouvrent dans un nouvel onglet.
 *
 * À NE PAS confondre avec le bouton « Contacter sur WhatsApp » de la fiche :
 * celui-ci PARTAGE l'annonce à un proche ; l'autre écrit à l'agence.
 */
export default function BoutonsPartage({
  url,
  titre,
}: {
  url: string;
  titre: string;
}) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé) : on ignore.
    }
  }

  const texte = `${titre} — ${url}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(texte)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(titre)}&url=${encodeURIComponent(url)}`;

  const lienClasse =
    "inline-flex items-center gap-2 rounded-full border border-sable-200 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-sable-100";

  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-medium text-stone-500">
        <Share2 className="h-4 w-4" aria-hidden="true" /> Partager ce bien
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={lienClasse}>
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
        </a>
        <a href={facebook} target="_blank" rel="noopener noreferrer" className={lienClasse}>
          <IconeFacebook /> Facebook
        </a>
        <a href={x} target="_blank" rel="noopener noreferrer" className={lienClasse}>
          <IconeX /> X
        </a>
        <button type="button" onClick={copier} className={lienClasse}>
          {copie ? (
            <>
              <Check className="h-4 w-4 text-green-600" aria-hidden="true" /> Copié
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" aria-hidden="true" /> Copier le lien
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* lucide-react ne fournit plus les logos de marques : SVG intégrés. */
function IconeFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
  );
}

function IconeX() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M18.9 2H22l-7.5 8.6L23 22h-6.3l-4.9-6.4L6.1 22H3l8-9.2L2 2h6.5l4.4 5.9L18.9 2Zm-1.1 18h1.7L7.3 3.8H5.5L17.8 20Z" />
    </svg>
  );
}
