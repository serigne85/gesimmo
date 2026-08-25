"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { trouverOuCreerContact } from "@/services/contacts";
import { creerBienSchema, modifierBienSchema } from "@/lib/validation/bien";
import { transitionAutorisee } from "@/services/statuts-bien";
import type { StatutBien, ObjectifBien } from "@/types/bien";

export type CreerBienState = { error: string | null; bienId?: string };

/**
 * Crée un bien à partir de la saisie rapide.
 * Étapes : contrôle d'accès → validation → trouver/créer le propriétaire →
 * générer une référence unique → insérer.
 * Le statut initial est `prospecte` (défaut en base) : un bien tout juste saisi
 * n'est pas encore sous mandat.
 */
export async function creerBien(
  _prevState: CreerBienState,
  formData: FormData
): Promise<CreerBienState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = creerBienSchema.safeParse({
    type: formData.get("type"),
    objectif: formData.get("objectif"),
    zoneId: formData.get("zoneId"),
    proprietaireNom: formData.get("proprietaireNom"),
    proprietaireTelephone: formData.get("proprietaireTelephone"),
    statut: formData.get("statut") || undefined,
    dateRelance: formData.get("dateRelance") || undefined,
    titre: formData.get("titre") || undefined,
    contactNom: formData.get("contactNom") || undefined,
    contactTelephone: formData.get("contactTelephone") || undefined,
    adresse: formData.get("adresse") || undefined,
    nombreChambres: formData.get("nombreChambres") || undefined,
    surface: formData.get("surface") || undefined,
    statutJuridique: formData.get("statutJuridique") || undefined,
    prix: formData.get("prix") || undefined,
    description: formData.get("description") || undefined,
    videoUrl: formData.get("videoUrl") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;
  const supabase = await createClient();

  // 1. Propriétaire (trouver ou créer par téléphone).
  let proprietaireId: string;
  try {
    proprietaireId = await trouverOuCreerContact(
      supabase,
      profil.agenceId,
      d.proprietaireNom,
      d.proprietaireTelephone
    );
  } catch {
    return { error: "Enregistrement du propriétaire impossible." };
  }

  // 1 bis. Contact secondaire (optionnel). Les deux champs vont de pair.
  let contactId: string | null = null;
  if (d.contactNom || d.contactTelephone) {
    if (!d.contactNom || !d.contactTelephone || d.contactTelephone.length < 6) {
      return { error: "Contact secondaire incomplet : nom et téléphone requis." };
    }
    try {
      contactId = await trouverOuCreerContact(
        supabase,
        profil.agenceId,
        d.contactNom,
        d.contactTelephone
      );
    } catch {
      return { error: "Enregistrement du contact impossible." };
    }
  }

  // 2. Référence unique. On part du nombre de biens existants et on réessaie
  //    en cas de collision (une référence peut être occupée par un bien
  //    supprimé, invisible via la RLS).
  const { count } = await supabase
    .from("biens")
    .select("id", { count: "exact", head: true });
  const base = (count ?? 0) + 1;
  const annee = new Date().getFullYear();

  let bienId: string | null = null;
  for (let i = 0; i < 6 && !bienId; i++) {
    const reference = `BN-${annee}-${String(base + i).padStart(4, "0")}`;
    const { data, error } = await supabase
      .from("biens")
      .insert({
        agence_id: profil.agenceId,
        reference,
        titre: d.titre ?? null,
        type: d.type,
        objectif: d.objectif,
        zone_id: d.zoneId,
        proprietaire_id: proprietaireId,
        contact_id: contactId,
        adresse: d.adresse ?? null,
        nombre_chambres: d.nombreChambres,
        surface_m2: d.surface,
        statut_juridique: d.statutJuridique ?? null,
        prix: d.prix,
        description: d.description ?? null,
        video_url: d.videoUrl ?? null,
      })
      .select("id")
      .single();

    if (!error && data) {
      bienId = data.id;
    } else if (error && error.code !== "23505") {
      // Autre erreur que le doublon de référence : on abandonne.
      return { error: "Enregistrement du bien impossible." };
    }
  }

  if (!bienId) return { error: "Génération de la référence impossible." };

  revalidatePath("/biens");
  // Pas de redirection ici : on renvoie l'id au formulaire, qui envoie d'abord
  // les photos éventuelles (elles ont besoin de ce bien_id) puis navigue vers
  // la fiche. C'est l'upload différé (staging) — voir SelecteurPhotos.
  return { error: null, bienId };
}

/**
 * Modifie les champs propres d'un bien (pas le propriétaire, pas le statut).
 * L'id est fixé par `.bind()` côté formulaire. La RLS garantit qu'on ne
 * modifie qu'un bien de sa propre agence.
 */
export async function modifierBien(
  id: string,
  _prevState: CreerBienState,
  formData: FormData
): Promise<CreerBienState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const parsed = modifierBienSchema.safeParse({
    type: formData.get("type"),
    objectif: formData.get("objectif"),
    zoneId: formData.get("zoneId"),
    titre: formData.get("titre") || undefined,
    adresse: formData.get("adresse") || undefined,
    nombreChambres: formData.get("nombreChambres") || undefined,
    surface: formData.get("surface") || undefined,
    statutJuridique: formData.get("statutJuridique") || undefined,
    prix: formData.get("prix") || undefined,
    description: formData.get("description") || undefined,
    videoUrl: formData.get("videoUrl") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("biens")
    .update({
      titre: d.titre ?? null,
      type: d.type,
      objectif: d.objectif,
      zone_id: d.zoneId,
      adresse: d.adresse ?? null,
      nombre_chambres: d.nombreChambres,
      surface_m2: d.surface,
      statut_juridique: d.statutJuridique ?? null,
      prix: d.prix,
      description: d.description ?? null,
      video_url: d.videoUrl ?? null,
    })
    .eq("id", id)
    .is("supprime_le", null)
    .select("id");

  if (error) return { error: "Modification du bien impossible." };
  if (!data || data.length === 0) return { error: "Bien introuvable." };

  revalidatePath("/biens");
  revalidatePath(`/biens/${id}`);
  redirect(`/biens/${id}`);
}

/**
 * Fait évoluer le statut d'un bien dans son cycle de vie. La transition est
 * validée côté serveur contre la machine à états (masquer un bouton ne suffit
 * pas). L'id est fixé par `.bind()`, la cible arrive du bouton cliqué.
 */
export async function changerStatutBien(
  id: string,
  _prevState: CreerBienState,
  formData: FormData
): Promise<CreerBienState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const cible = formData.get("cible") as StatutBien;
  const supabase = await createClient();

  // Statut actuel + objectif du bien (RLS : forcément dans l'agence).
  const { data: courant } = await supabase
    .from("biens")
    .select("statut, objectif")
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (!courant) return { error: "Bien introuvable." };

  const actuel = courant.statut as StatutBien;
  const objectif = courant.objectif as ObjectifBien;

  if (!transitionAutorisee(actuel, cible, objectif)) {
    return { error: "Transition de statut non autorisée." };
  }

  const { error } = await supabase
    .from("biens")
    .update({ statut: cible })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) return { error: "Changement de statut impossible." };

  revalidatePath("/biens");
  revalidatePath(`/biens/${id}`);
  redirect(`/biens/${id}`);
}

/**
 * Publie ou retire un bien du site vitrine. Un bien n'est visible publiquement
 * que s'il est `disponible` ET `publie` — on ne peut donc PUBLIER qu'un bien
 * disponible (le dépublier reste possible dans tous les cas). Contrôle côté
 * serveur : masquer le bouton ne suffit pas. On revalide aussi les pages
 * publiques pour que le site reflète le changement immédiatement.
 */
export async function definirPublicationBien(
  id: string,
  _prevState: CreerBienState,
  formData: FormData
): Promise<CreerBienState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };

  const publier = formData.get("publier") === "1";
  const supabase = await createClient();

  const { data: courant } = await supabase
    .from("biens")
    .select("statut")
    .eq("id", id)
    .is("supprime_le", null)
    .maybeSingle();

  if (!courant) return { error: "Bien introuvable." };

  if (publier && (courant.statut as StatutBien) !== "disponible") {
    return { error: "Seul un bien « Disponible » peut être publié." };
  }

  const { error } = await supabase
    .from("biens")
    .update({
      publie: publier,
      publie_le: publier ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .is("supprime_le", null);

  if (error) return { error: "Mise à jour de la publication impossible." };

  revalidatePath("/biens");
  revalidatePath(`/biens/${id}`);
  // Site public : la liste et la fiche doivent refléter le changement.
  revalidatePath("/nos-biens");
  revalidatePath(`/nos-biens/${id}`);
  return { error: null };
}

export type SupprimerBiensState = { error: string | null };

/**
 * Suppression LOGIQUE de biens (marque `supprime_le`), jamais de DELETE physique
 * (CLAUDE.md). Réservée à l'admin : contrôle serveur. Écriture privilégiée via
 * service_role, RESTREINTE explicitement à l'agence de l'admin.
 */
export async function supprimerBiens(
  ids: string[]
): Promise<SupprimerBiensState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif) return { error: "Accès refusé." };
  if (profil.role !== "admin") {
    return { error: "Suppression réservée à l'administrateur." };
  }
  if (!Array.isArray(ids) || ids.length === 0) {
    return { error: "Aucun bien sélectionné." };
  }

  // Suppression logique via le client de session : la RLS (biens_update)
  // cloisonne à l'agence de l'utilisateur.
  const supabase = await createClient();
  const { error } = await supabase
    .from("biens")
    .update({ supprime_le: new Date().toISOString() })
    .in("id", ids)
    .is("supprime_le", null);

  if (error) {
    console.error("supprimerBiens:", error);
    return { error: "Suppression impossible." };
  }

  revalidatePath("/biens");
  return { error: null };
}
