import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase "administrateur" utilisant la clé service_role.
 *
 * ⚠️ Cette clé CONTOURNE la RLS : elle a tous les droits. Elle ne doit JAMAIS
 * atteindre le navigateur. La ligne `import "server-only"` en tête garantit
 * qu'un import accidentel depuis un Client Component fait échouer le build.
 *
 * À n'utiliser que dans des Server Actions/services, APRÈS avoir vérifié que
 * l'appelant a le droit d'agir (voir lib/auth/guards.ts).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Clé service_role manquante. Ajoute SUPABASE_SERVICE_ROLE_KEY dans .env.local."
    );
  }

  return createClient(url, serviceKey, {
    // Pas de session à persister : ce client n'agit pas au nom d'un utilisateur.
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
