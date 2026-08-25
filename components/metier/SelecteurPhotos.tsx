"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { compresserImage } from "@/lib/utils/image";
import { enregistrerPhoto } from "@/services/photos-actions";

/**
 * Sélecteur de photos pour la CRÉATION d'un bien, en « upload différé » :
 * le bien n'existe pas encore, donc on ne peut pas envoyer les photos tout de
 * suite (elles ont besoin d'un bien_id). On les compresse et on les garde en
 * mémoire (aperçu via URL.createObjectURL) ; le formulaire parent appelle
 * `uploadTo(bienId)` une fois le bien créé.
 *
 * Le parent pilote ce composant via une `ref` (useImperativeHandle) : il n'a
 * pas besoin de connaître les fichiers, seulement de déclencher l'envoi.
 */
export type SelecteurPhotosHandle = {
  /** Nombre de photos en attente. */
  count: () => number;
  /** Envoie les photos vers le bien. Renvoie un message d'erreur, ou null. */
  uploadTo: (bienId: string) => Promise<string | null>;
};

type PhotoEnAttente = { id: string; url: string; blob: Blob };

const SelecteurPhotos = forwardRef<SelecteurPhotosHandle, { disabled?: boolean }>(
  function SelecteurPhotos({ disabled }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [items, setItems] = useState<PhotoEnAttente[]>([]);
    const [enCours, setEnCours] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Libère les URLs d'aperçu quand le composant est démonté (évite les fuites).
    useEffect(() => {
      return () => items.forEach((it) => URL.revokeObjectURL(it.url));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function ajouter(e: React.ChangeEvent<HTMLInputElement>) {
      const fichiers = Array.from(e.target.files ?? []);
      if (fichiers.length === 0) return;

      setError(null);
      setEnCours(true);
      try {
        const nouveaux: PhotoEnAttente[] = [];
        for (const f of fichiers) {
          if (!f.type.startsWith("image/")) {
            setError("Seules les images sont acceptées.");
            continue;
          }
          const blob = await compresserImage(f);
          nouveaux.push({
            id: crypto.randomUUID(),
            url: URL.createObjectURL(blob),
            blob,
          });
        }
        setItems((prev) => [...prev, ...nouveaux]);
      } catch {
        setError("Traitement de l'image impossible.");
      } finally {
        setEnCours(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    }

    function retirer(id: string) {
      setItems((prev) => {
        const it = prev.find((x) => x.id === id);
        if (it) URL.revokeObjectURL(it.url);
        return prev.filter((x) => x.id !== id);
      });
    }

    useImperativeHandle(
      ref,
      () => ({
        count: () => items.length,
        uploadTo: async (bienId: string) => {
          for (const it of items) {
            const fd = new FormData();
            fd.append("photo", it.blob, "photo.jpg");
            const res = await enregistrerPhoto(bienId, fd);
            if (res.error) return res.error;
          }
          return null;
        },
      }),
      [items]
    );

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Photos (optionnel)
          </span>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900">
            {enCours ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
            )}
            {enCours ? "Préparation…" : "Ajouter"}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={disabled || enCours}
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

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ajoutez des photos prises sur le terrain. Elles sont compressées
            avant l&apos;envoi et jointes au bien dès sa création.
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {items.map((it) => (
              <li
                key={it.id}
                className="relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.url}
                  alt="Aperçu"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => retirer(it.id)}
                  title="Retirer"
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-red-600 disabled:opacity-40"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

export default SelecteurPhotos;
