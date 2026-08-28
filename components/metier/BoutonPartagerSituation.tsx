"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

/**
 * Partage le PDF de la situation via le sélecteur natif (Web Share API) : sur
 * mobile, ça ouvre WhatsApp (entre autres) avec le fichier joint. Là où le
 * partage de fichier n'est pas supporté (ordinateur), on retombe sur un
 * téléchargement. Le PDF est récupéré depuis la route protégée (cookies de
 * session envoyés automatiquement).
 */
export default function BoutonPartagerSituation({
  url,
  filename,
  titre,
}: {
  url: string;
  filename: string;
  titre: string;
}) {
  const [busy, setBusy] = useState(false);

  async function partager() {
    setBusy(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Génération du PDF impossible.");
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "application/pdf" });

      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
      };

      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: titre, text: titre });
      } else {
        // Repli : téléchargement local (l'agent joint le fichier lui-même).
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(href);
      }
    } catch {
      // Partage annulé ou indisponible : on ne fait rien.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={partager}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-md bg-blue-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
    >
      <Share2 className="h-4 w-4" aria-hidden="true" />
      {busy ? "Préparation…" : "Partager"}
    </button>
  );
}
