"use server";

import { createClient } from "@/lib/supabase/server";
import { changerMotDePasseSchema } from "@/lib/validation/compte";

/**
 * Server Actions du compte de l'utilisateur CONNECTÉ (agit sur soi-même).
 * À distinguer de utilisateurs-actions.ts, réservé aux admins agissant sur
 * les autres comptes.
 */

export type ChangerMotDePasseState = {
  error: string | null;
  success: string | null;
};

/**
 * Change le mot de passe de l'utilisateur connecté.
 *
 * Étapes :
 *  1. valider les entrées (serveur, obligatoire même si le client a validé) ;
 *  2. vérifier le mot de passe ACTUEL en le rejouant (signInWithPassword) ;
 *  3. appliquer le nouveau (updateUser) sur la session en cours.
 */
export async function changerMotDePasse(
  _prevState: ChangerMotDePasseState,
  formData: FormData
): Promise<ChangerMotDePasseState> {
  const parsed = changerMotDePasseSchema.safeParse({
    motDePasseActuel: formData.get("motDePasseActuel"),
    nouveauMotDePasse: formData.get("nouveauMotDePasse"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides.", success: null };
  }

  const supabase = await createClient();

  // Utilisateur courant (et son e-mail, nécessaire pour revérifier le mot de passe).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Session expirée. Reconnectez-vous.", success: null };
  }

  // 2. Vérifier le mot de passe actuel. En cas d'échec, on n'applique rien.
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.motDePasseActuel,
  });

  if (signInErr) {
    return { error: "Mot de passe actuel incorrect.", success: null };
  }

  // 3. Appliquer le nouveau mot de passe.
  const { error: updateErr } = await supabase.auth.updateUser({
    password: parsed.data.nouveauMotDePasse,
  });

  if (updateErr) {
    return { error: "Changement impossible. Réessayez.", success: null };
  }

  return { error: null, success: "Votre mot de passe a été mis à jour." };
}
