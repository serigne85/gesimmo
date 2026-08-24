import { redirect } from "next/navigation";
import { getUtilisateurConnecte } from "@/services/auth";
import { listUtilisateurs } from "@/services/utilisateurs";
import GestionUtilisateurs from "@/components/metier/GestionUtilisateurs";

/**
 * Page de gestion des utilisateurs — réservée aux admins.
 *
 * Server Component : on vérifie le rôle et on charge les données côté serveur,
 * puis on passe le tout à un Client Component pour l'interactivité.
 * La sécurité ne repose pas sur le masquage du menu : on revérifie ici, et
 * chaque action serveur revérifie aussi (requireAdmin).
 */
export default async function UtilisateursPage() {
  const profil = await getUtilisateurConnecte();

  // Double garde côté serveur : accès refusé si pas admin.
  if (!profil || profil.role !== "admin") {
    redirect("/tableau-de-bord");
  }

  const utilisateurs = await listUtilisateurs(profil.agenceId);

  return (
    <GestionUtilisateurs utilisateurs={utilisateurs} currentUserId={profil.id} />
  );
}
