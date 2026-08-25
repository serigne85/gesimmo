import { NextResponse, type NextRequest } from "next/server";
import { getUrlPhotoPrincipalePublique } from "@/services/vitrine";

/**
 * Route-image publique et STABLE de la photo principale d'un bien.
 *
 * Pourquoi : les photos vivent dans un bucket privé, servies par des URLs
 * signées qui expirent en 1 h — inutilisables comme `og:image` (l'aperçu de lien
 * partagé se casserait). Ici, l'URL /api/vitrine/photo/[bienId] ne change jamais ;
 * à chaque appel on génère une URL signée fraîche côté serveur et on relaie les
 * octets de l'image. Le robot de WhatsApp/Facebook reçoit une image normale.
 *
 * Sécurité : le service ne renvoie la photo que si le bien est `disponible`.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bienId: string }> }
) {
  const { bienId } = await params;

  const url = await getUrlPhotoPrincipalePublique(bienId);
  if (!url) {
    return new NextResponse(null, { status: 404 });
  }

  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      // Cache CDN/navigateur : l'image change rarement, on évite de re-signer
      // à chaque visite d'un robot.
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
