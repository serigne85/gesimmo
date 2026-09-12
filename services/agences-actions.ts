"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";

/**
 * Bascule l'agence active du super-admin. Sécurité en profondeur :
 *  1. contrôle applicatif : réservé au super-admin,
 *  2. contrôle base : même si on forçait l'écriture, agence_courante() n'honore
 *     la ligne agence_active que pour un super_admin — un compte ordinaire
 *     resterait sur son agence d'origine.
 * L'agence cible doit être visible de l'appelant (la RLS ne montre les autres
 * agences qu'au super-admin), ce qui bloque une bascule vers une agence tierce.
 */
export async function changerAgenceActive(formData: FormData): Promise<void> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif || !profil.superAdmin) {
    throw new Error("Bascule d'agence réservée au super-admin.");
  }

  const agenceId = String(formData.get("agenceId") ?? "");
  if (!agenceId) throw new Error("Agence manquante.");

  const supabase = await createClient();

  // L'agence cible doit exister ET être visible (RLS) : un super-admin voit
  // toutes les agences, donc ceci passe pour une agence réelle uniquement.
  const { data: agence } = await supabase
    .from("agences")
    .select("id")
    .eq("id", agenceId)
    .is("supprime_le", null)
    .maybeSingle();

  if (!agence) throw new Error("Agence introuvable.");

  const { error } = await supabase
    .from("agence_active")
    .upsert(
      { utilisateur_id: profil.id, agence_id: agenceId, maj_le: new Date().toISOString() },
      { onConflict: "utilisateur_id" }
    );

  if (error) throw new Error("Bascule d'agence impossible.");

  // Toute l'application dépend de l'agence : on invalide le cache global puis on
  // renvoie au tableau de bord de l'agence fraîchement sélectionnée.
  revalidatePath("/", "layout");
  redirect("/tableau-de-bord");
}
