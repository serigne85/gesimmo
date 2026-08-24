/**
 * Lecture centralisée des variables d'environnement Supabase.
 * Échoue tôt avec un message clair si une variable manque — plutôt qu'une
 * erreur obscure au premier appel réseau.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variables Supabase manquantes. Renseigne NEXT_PUBLIC_SUPABASE_URL et " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local (voir .env.example)."
    );
  }

  return { url, anonKey };
}
