"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { compresserImage } from "@/lib/utils/image";
import {
  enregistrerPhoto,
  supprimerPhoto,
  definirPhotoPrincipale,
  deplacerPhoto,
} from "@/services/photos-actions";
import type { PhotoBien } from "@/types/photo";
import TuilePhoto from "./TuilePhoto";

/**
 * Galerie de photos d'un bien : ajout (compression navigateur puis upload),
 * suppression, choix de la principale, réordonnancement. Aucune logique métier
 * ici — tout passe par les Server Actions ; chaque tuile est un TuilePhoto.
 */
export default function GaleriePhotos({
  bienId,
  photos,
}: {
  bienId: string;
  photos: PhotoBien[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enCours, setEnCours] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ajouter(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files ?? []);
    if (fichiers.length === 0) return;

    setError(null);
    setEnCours(true);
    try {
      for (const f of fichiers) {
        if (!f.type.startsWith("image/")) {
          setError("Seules les images sont acceptées.");
          continue;
        }
        const blob = await compresserImage(f);
        const fd = new FormData();
        fd.append("photo", blob, "photo.jpg");
        const res = await enregistrerPhoto(bienId, fd);
        if (res.error) {
          setError(res.error);
          break;
        }
      }
    } catch {
      setError("Traitement de l'image impossible.");
    } finally {
      setEnCours(false);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    }
  }

  async function retirer(photoId: string) {
    if (!confirm("Supprimer cette photo ?")) return;
    setError(null);
    setOccupe(true);
    const res = await supprimerPhoto(photoId);
    if (res.error) setError(res.error);
    setOccupe(false);
    router.refresh();
  }

  async function rendrePrincipale(photoId: string) {
    setError(null);
    setOccupe(true);
    const res = await definirPhotoPrincipale(photoId);
    if (res.error) setError(res.error);
    setOccupe(false);
    router.refresh();
  }

  async function deplacer(photoId: string, sens: "avant" | "apres") {
    setError(null);
    setOccupe(true);
    const res = await deplacerPhoto(photoId, sens);
    if (res.error) setError(res.error);
    setOccupe(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Photos
        </h2>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900">
          {enCours ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          )}
          {enCours ? "Envoi…" : "Ajouter"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={enCours}
            onChange={ajouter}
          />
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Aucune photo. Ajoutez-en depuis le terrain, elles sont compressées avant envoi.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, i) => (
            <TuilePhoto
              key={photo.id}
              photo={photo}
              isFirst={i === 0}
              isLast={i === photos.length - 1}
              disabled={enCours || occupe}
              onPrincipale={rendrePrincipale}
              onDeplacer={deplacer}
              onSupprimer={retirer}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
