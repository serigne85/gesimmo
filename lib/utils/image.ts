/**
 * Compresse une image DANS LE NAVIGATEUR avant upload (la connexion terrain est
 * lente — CLAUDE.md). L'image est redimensionnée à `maxPx` sur son plus grand
 * côté et réencodée en JPEG. À n'utiliser que côté client : dépend du DOM
 * (createImageBitmap, canvas).
 */
export async function compresserImage(
  file: File,
  maxPx = 1600,
  quality = 0.8
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  // On ne fait que réduire, jamais agrandir (echelle plafonnée à 1).
  const echelle = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const largeur = Math.round(bitmap.width * echelle);
  const hauteur = Math.round(bitmap.height * echelle);

  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Compression impossible (canvas indisponible).");
  ctx.drawImage(bitmap, 0, 0, largeur, hauteur);
  bitmap.close?.();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Compression de l'image échouée.")),
      "image/jpeg",
      quality
    );
  });
}
