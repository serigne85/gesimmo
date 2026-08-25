import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PhotoBien } from "@/types/photo";

const BUCKET = "biens";
const URL_VALIDITE_S = 3600; // URLs signées valables 1 heure

/**
 * Photos d'un bien, triées, avec une URL signée temporaire pour chacune.
 * Les lignes sont lues via le client de session (RLS = cloisonnement agence) ;
 * les URLs signées sont générées avec le client admin (bucket privé).
 */
export async function getPhotosBien(bienId: string): Promise<PhotoBien[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("photos_bien")
    .select("id, chemin, est_principale, ordre")
    .eq("bien_id", bienId)
    .order("ordre", { ascending: true });

  if (error) throw new Error(`Lecture des photos impossible : ${error.message}`);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const admin = createAdminClient();
  const { data: signed, error: sErr } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(
      rows.map((r) => r.chemin),
      URL_VALIDITE_S
    );

  if (sErr) throw new Error(`Génération des URLs impossible : ${sErr.message}`);

  const urlParChemin = new Map<string, string>();
  (signed ?? []).forEach((s) => {
    if (s.path && s.signedUrl) urlParChemin.set(s.path, s.signedUrl);
  });

  return rows.map((r) => ({
    id: r.id,
    url: urlParChemin.get(r.chemin) ?? "",
    estPrincipale: r.est_principale,
    ordre: r.ordre,
  }));
}

/**
 * URLs signées des photos PRINCIPALES pour un lot de biens (vignettes de liste).
 * Tout est fait en une requête + un seul appel de signature : on évite le N+1
 * (une requête par bien) qui plomberait la liste. Renvoie une Map bien_id → url ;
 * un bien sans photo principale est simplement absent de la Map.
 */
export async function getUrlsPhotosPrincipales(
  bienIds: string[]
): Promise<Map<string, string>> {
  const resultat = new Map<string, string>();
  if (bienIds.length === 0) return resultat;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("photos_bien")
    .select("bien_id, chemin")
    .in("bien_id", bienIds)
    .eq("est_principale", true);

  if (error) throw new Error(`Lecture des photos impossible : ${error.message}`);
  const rows = data ?? [];
  if (rows.length === 0) return resultat;

  const admin = createAdminClient();
  const { data: signed, error: sErr } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(
      rows.map((r) => r.chemin),
      URL_VALIDITE_S
    );

  if (sErr) throw new Error(`Génération des URLs impossible : ${sErr.message}`);

  const urlParChemin = new Map<string, string>();
  (signed ?? []).forEach((s) => {
    if (s.path && s.signedUrl) urlParChemin.set(s.path, s.signedUrl);
  });

  rows.forEach((r) => {
    const url = urlParChemin.get(r.chemin);
    if (url) resultat.set(r.bien_id as string, url);
  });
  return resultat;
}
