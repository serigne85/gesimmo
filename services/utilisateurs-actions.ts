"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";
import { creerUtilisateurSchema } from "@/lib/validation/utilisateur";
import type { Role } from "@/types/roles";

/**
 * Server Actions de gestion des utilisateurs. Chacune :
 *  1. vérifie que l'appelant est admin (requireAdmin),
 *  2. vérifie que la cible appartient à la même agence,
 *  3. agit via le client service_role,
 *  4. rafraîchit la liste (revalidatePath).
 */

export type CreerUtilisateurState = {
  error: string | null;
  success: string | null;
};

/**
 * Charge la cible et garantit qu'elle est dans l'agence de l'admin.
 * Sécurité multi-agence : un admin n'agit jamais sur une autre agence.
 */
async function chargerCibleMemeAgence(userId: string, agenceId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("utilisateurs")
    .select("id, agence_id")
    .eq("id", userId)
    .is("supprime_le", null)
    .single();

  if (error || !data || data.agence_id !== agenceId) {
    throw new Error("Utilisateur introuvable dans votre agence.");
  }
  return data;
}

/** Création d'un compte (auth + profil). Signature pour useActionState. */
export async function creerUtilisateur(
  _prevState: CreerUtilisateurState,
  formData: FormData
): Promise<CreerUtilisateurState> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { error: "Accès refusé.", success: null };
  }

  const parsed = creerUtilisateurSchema.safeParse({
    nomComplet: formData.get("nomComplet"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides.", success: null };
  }

  const { nomComplet, email, role, password } = parsed.data;
  const supabase = createAdminClient();

  // 1. Créer le compte d'authentification (email_confirm : connexion immédiate).
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr || !created.user) {
    const dejaPris = /already|registered|exists/i.test(createErr?.message ?? "");
    return {
      error: dejaPris
        ? "Un compte existe déjà avec cet e-mail."
        : "Création du compte impossible.",
      success: null,
    };
  }

  // 2. Créer le profil applicatif dans la même agence que l'admin.
  const { error: insErr } = await supabase.from("utilisateurs").insert({
    id: created.user.id,
    agence_id: admin.agenceId,
    nom_complet: nomComplet,
    email,
    role,
  });

  if (insErr) {
    // Rollback : supprimer le compte auth pour ne pas laisser d'orphelin.
    await supabase.auth.admin.deleteUser(created.user.id);
    return { error: "Enregistrement du profil impossible.", success: null };
  }

  revalidatePath("/utilisateurs");
  return { error: null, success: `${nomComplet} a été ajouté.` };
}

/** Active ou désactive un compte. Un admin ne peut pas se désactiver lui-même. */
export async function basculerActif(
  userId: string,
  actif: boolean
): Promise<{ error: string | null }> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { error: "Accès refusé." };
  }

  if (userId === admin.id) {
    return { error: "Vous ne pouvez pas modifier votre propre statut." };
  }

  try {
    await chargerCibleMemeAgence(userId, admin.agenceId);
  } catch {
    return { error: "Utilisateur introuvable dans votre agence." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("utilisateurs")
    .update({ actif })
    .eq("id", userId);

  if (error) return { error: "Mise à jour impossible." };

  revalidatePath("/utilisateurs");
  return { error: null };
}

/** Change le rôle d'un utilisateur. Un admin ne peut pas changer le sien. */
export async function changerRole(
  userId: string,
  role: Role
): Promise<{ error: string | null }> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { error: "Accès refusé." };
  }

  if (userId === admin.id) {
    return { error: "Vous ne pouvez pas changer votre propre rôle." };
  }

  try {
    await chargerCibleMemeAgence(userId, admin.agenceId);
  } catch {
    return { error: "Utilisateur introuvable dans votre agence." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("utilisateurs")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: "Mise à jour impossible." };

  revalidatePath("/utilisateurs");
  return { error: null };
}

/** Suppression LOGIQUE (supprime_le). Jamais de DELETE physique (CLAUDE.md). */
export async function supprimerUtilisateur(
  userId: string
): Promise<{ error: string | null }> {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { error: "Accès refusé." };
  }

  if (userId === admin.id) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  }

  try {
    await chargerCibleMemeAgence(userId, admin.agenceId);
  } catch {
    return { error: "Utilisateur introuvable dans votre agence." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("utilisateurs")
    .update({ supprime_le: new Date().toISOString(), actif: false })
    .eq("id", userId);

  if (error) return { error: "Suppression impossible." };

  revalidatePath("/utilisateurs");
  return { error: null };
}
