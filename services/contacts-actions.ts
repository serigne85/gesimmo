"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUtilisateurConnecte } from "@/services/auth";
import { identiteContactSchema } from "@/lib/validation/contact";

export type IdentiteContactState = { error: string | null };

/** Rôles autorisés à éditer l'identité civile d'un contact. */
const ROLES_EDITION = ["admin", "direction", "agent", "gestionnaire"] as const;

/**
 * Met à jour l'identité civile d'un contact (nom + naissance + CNI), pour les
 * contrats. Contrôle serveur du rôle ; la RLS cloisonne déjà par agence.
 * L'id est fixé par `.bind()` côté formulaire.
 */
export async function modifierIdentiteContact(
  id: string,
  _prevState: IdentiteContactState,
  formData: FormData
): Promise<IdentiteContactState> {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif || !ROLES_EDITION.includes(profil.role as never)) {
    return { error: "Accès refusé." };
  }

  const parsed = identiteContactSchema.safeParse({
    nomComplet: formData.get("nomComplet"),
    dateNaissance: formData.get("dateNaissance") || undefined,
    lieuNaissance: formData.get("lieuNaissance") || undefined,
    cni: formData.get("cni") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .update({
      nom_complet: d.nomComplet,
      date_naissance: d.dateNaissance,
      lieu_naissance: d.lieuNaissance,
      cni: d.cni,
    })
    .eq("id", id)
    .is("supprime_le", null)
    .select("id");

  if (error) return { error: "Modification du contact impossible." };
  if (!data || data.length === 0) return { error: "Contact introuvable." };

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  redirect(`/contacts/${id}`);
}
