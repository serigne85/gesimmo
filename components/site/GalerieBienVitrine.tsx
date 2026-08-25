"use client";

/* eslint-disable @next/next/no-img-element -- URLs signées Supabase (bucket privé) : <img>, pas next/image. */

import { useState } from "react";
import { House } from "lucide-react";

/**
 * Galerie photos de la fiche publique : une grande image + une bande de
 * miniatures cliquables. Composant client car il y a une interaction (choisir
 * la photo affichée). Aucune logique métier — juste de l'affichage.
 */
export default function GalerieBienVitrine({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const [actif, setActif] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-sable-100 text-sable-200 ring-1 ring-sable-200">
        <House className="h-16 w-16" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sable-100 ring-1 ring-sable-200">
        <img
          src={photos[actif]}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>

      {photos.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {photos.map((url, i) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setActif(i)}
                aria-label={`Voir la photo ${i + 1}`}
                aria-current={i === actif}
                className={`block aspect-square w-full overflow-hidden rounded-lg ring-2 transition ${
                  i === actif
                    ? "ring-terracotta-500"
                    : "ring-transparent hover:ring-sable-200"
                }`}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
