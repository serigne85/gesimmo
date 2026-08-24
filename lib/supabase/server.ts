import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * Client Supabase pour le SERVEUR (Server Components, Server Actions).
 *
 * En Next.js 16, cookies() est asynchrone : d'où le `await`. Ce client lit la
 * session dans les cookies de la requête. L'écriture des cookies (setAll) peut
 * échouer depuis un Server Component pur — c'est normal, le proxy s'en charge —
 * d'où le try/catch silencieux.
 */
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Appelé depuis un Server Component : le rafraîchissement de session
          // est géré par le proxy. Sans risque de l'ignorer ici.
        }
      },
    },
  });
}
