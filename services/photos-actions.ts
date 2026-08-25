"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUtilisateurConnecte } from "@/services/auth";

const BUCKET = "biens";
const TAILLE_MAX = 3 * 1024 * 1024; // 3 Mo : large marge après compression

export type PhotoActionState = { error: string | null };

/**
 * Enregistre une photo (déjà compressée côté client) pour un bien.
 * Autorisation serveur → upload Storage (service_role) → ligne photos_bien.
 * La 1re photo d'un bien devient sa photo principale.
 */
export async function enregistrerPhoto(
  bienId: string,
  formData: FormData
): Promise<PhotoActionState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const fichier = formData.get("photo");
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { error: "Fichier manquant." };
  }
  if (fichier.size > TAILLE_MAX) return { error: "Image trop lourde." };

  const supabase = await createClient();

  // Le bien appartient-il à l'agence de l'utilisateur ? (RLS)
  const { data: bien } = await supabase
    .from("biens")
    .select("id")
    .eq("id", bienId)
    .is("supprime_le", null)
    .maybeSingle();
  if (!bien) return { error: "Bien introuvable." };

  const { count } = await supabase
    .from("photos_bien")
    .select("id", { count: "exact", head: true })
    .eq("bien_id", bienId);
  const nb = count ?? 0;

  const chemin = `${profil.agenceId}/${bienId}/${crypto.randomUUID()}.jpg`;
  const admin = createAdminClient();

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(chemin, fichier, { contentType: "image/jpeg", upsert: false });
  if (upErr) return { error: "Upload de la photo impossible." };

  const { error: insErr } = await supabase.from("photos_bien").insert({
    agence_id: profil.agenceId,
    bien_id: bienId,
    chemin,
    est_principale: nb === 0,
    ordre: nb,
  });

  if (insErr) {
    // On ne laisse pas de fichier orphelin dans le bucket.
    await admin.storage.from(BUCKET).remove([chemin]);
    return { error: "Enregistrement de la photo impossible." };
  }

  revalidatePath(`/biens/${bienId}`);
  return { error: null };
}

/**
 * Supprime une photo (ligne + fichier Storage). Si c'était la principale et
 * qu'il reste des photos, la plus ancienne prend le relais.
 */
export async function supprimerPhoto(photoId: string): Promise<PhotoActionState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("photos_bien")
    .select("id, bien_id, chemin, est_principale")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo) return { error: "Photo introuvable." };

  const { error: delErr } = await supabase
    .from("photos_bien")
    .delete()
    .eq("id", photoId);
  if (delErr) return { error: "Suppression de la photo impossible." };

  const admin = createAdminClient();
  await admin.storage.from(BUCKET).remove([photo.chemin]);

  if (photo.est_principale) {
    const { data: suivante } = await supabase
      .from("photos_bien")
      .select("id")
      .eq("bien_id", photo.bien_id)
      .order("ordre", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (suivante) {
      await supabase
        .from("photos_bien")
        .update({ est_principale: true })
        .eq("id", suivante.id);
    }
  }

  revalidatePath(`/biens/${photo.bien_id}`);
  return { error: null };
}

/**
 * Désigne une photo comme principale : on retire d'abord le drapeau des autres
 * photos du bien (une seule principale à la fois), puis on le pose sur celle-ci.
 */
export async function definirPhotoPrincipale(
  photoId: string
): Promise<PhotoActionState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("photos_bien")
    .select("id, bien_id")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo) return { error: "Photo introuvable." };

  await supabase
    .from("photos_bien")
    .update({ est_principale: false })
    .eq("bien_id", photo.bien_id);

  const { error } = await supabase
    .from("photos_bien")
    .update({ est_principale: true })
    .eq("id", photoId);
  if (error) return { error: "Choix de la photo principale impossible." };

  revalidatePath(`/biens/${photo.bien_id}`);
  return { error: null };
}

/**
 * Déplace une photo d'un cran dans l'ordre d'affichage, en échangeant sa
 * position `ordre` avec sa voisine (`avant` = plus tôt, `apres` = plus tard).
 */
export async function deplacerPhoto(
  photoId: string,
  sens: "avant" | "apres"
): Promise<PhotoActionState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("photos_bien")
    .select("id, bien_id, ordre")
    .eq("id", photoId)
    .maybeSingle();
  if (!photo) return { error: "Photo introuvable." };

  // Voisine immédiate dans le sens demandé.
  const { data: voisine } = await supabase
    .from("photos_bien")
    .select("id, ordre")
    .eq("bien_id", photo.bien_id)
    .filter("ordre", sens === "avant" ? "lt" : "gt", photo.ordre)
    .order("ordre", { ascending: sens === "apres" })
    .limit(1)
    .maybeSingle();
  if (!voisine) return { error: null }; // déjà à l'extrémité : rien à faire

  // Échange des positions.
  await supabase
    .from("photos_bien")
    .update({ ordre: voisine.ordre })
    .eq("id", photo.id);
  await supabase
    .from("photos_bien")
    .update({ ordre: photo.ordre })
    .eq("id", voisine.id);

  revalidatePath(`/biens/${photo.bien_id}`);
  return { error: null };
}
