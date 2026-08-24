import AppShell from "@/components/layout/AppShell";
import { CURRENT_ROLE } from "@/types/roles";

/**
 * Layout partagé par toutes les pages de l'application protégée.
 *
 * Le dossier "(app)" est un ROUTE GROUP : les parenthèses regroupent des routes
 * sous un même layout SANS ajouter de segment à l'URL. La page dans
 * app/(app)/biens/page.tsx répond donc à /biens, pas à /(app)/biens.
 *
 * Ce layout reste un SERVER COMPONENT (pas de 'use client') : le filtrage de la
 * navigation par rôle se fait ici, sur le serveur, et on n'envoie au navigateur
 * que les entrées autorisées. Filtrer côté serveur, afficher côté client.
 *
 * TODO (auth) : quand la session existera, on lira le rôle depuis Supabase
 * au lieu de la constante CURRENT_ROLE, et on redirigera vers /connexion si
 * l'utilisateur n'est pas authentifié. Le rôle restera passé sous forme de
 * chaîne (sérialisable) au AppShell.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell role={CURRENT_ROLE}>{children}</AppShell>;
}
