import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Rafraîchit la session Supabase à chaque requête et protège les routes.
 *
 * Appelé depuis proxy.ts (ex-middleware, renommé en Next.js 16). Rôle double :
 *  1. Rafraîchir le jeton d'accès (sinon la session expire) et réécrire le cookie.
 *  2. Rediriger vers /connexion tout visiteur non authentifié.
 *
 * On lit l'utilisateur avec getUser() (et pas getSession()) car getUser()
 * revalide le jeton côté serveur Supabase — c'est la source fiable.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes publiques : tout ce qui commence par /connexion.
  const isPublicRoute = request.nextUrl.pathname.startsWith("/connexion");

  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/connexion";
    return NextResponse.redirect(redirectUrl);
  }

  // IMPORTANT : renvoyer `response` (et pas un NextResponse neuf) pour ne pas
  // perdre les cookies de session rafraîchis.
  return response;
}
