import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Proxy Next.js 16 (anciennement middleware.ts).
 * S'exécute avant chaque page : rafraîchit la session et protège les routes.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // On exclut les fichiers statiques et images, sinon le proxy s'exécuterait
  // aussi sur le CSS/JS/images et pourrait bloquer leur chargement.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
