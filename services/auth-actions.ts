"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { connexionSchema } from "@/lib/validation/auth";

/**
 * "use server" : tout ce fichier expose des Server Actions. Elles s'exécutent
 * sur le serveur mais sont appelables depuis un formulaire côté client via
 * l'attribut `action` d'un <form>.
 */

export type ConnexionState = { error: string | null };

/**
 * Connexion par e-mail + mot de passe.
 * Signature (prevState, formData) : c'est le format attendu par useActionState.
 */
export async function connexion(
  _prevState: ConnexionState,
  formData: FormData
): Promise<ConnexionState> {
  // Validation serveur OBLIGATOIRE, même si le client a déjà validé (CLAUDE.md).
  const parsed = connexionSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Message volontairement générique : on ne révèle pas si c'est l'e-mail
    // ou le mot de passe qui est faux.
    return { error: "Identifiants incorrects." };
  }

  // redirect() interrompt l'exécution : le code après n'est jamais atteint.
  redirect("/tableau-de-bord");
}

/** Déconnexion : utilisée comme `action` d'un <form> (reçoit un FormData ignoré). */
export async function deconnexion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
