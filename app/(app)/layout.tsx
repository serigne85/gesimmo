import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getUtilisateurConnecte } from "@/services/auth";
import { listAgencesPourBascule } from "@/services/agences";

/**
 * Layout partagé par toutes les pages de l'application protégée.
 *
 * Le dossier "(app)" est un ROUTE GROUP : les parenthèses regroupent des routes
 * sous un même layout SANS ajouter de segment à l'URL (/biens reste /biens).
 *
 * SERVER COMPONENT : on lit ici le profil réel de l'utilisateur (rôle, nom).
 * Le proxy garantit déjà qu'une session existe ; si le profil applicatif est
 * absent (compte auth sans ligne dans `utilisateurs`), on renvoie à /connexion.
 * On ne passe au client que des données sérialisables (rôle et nom, en texte).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profil = await getUtilisateurConnecte();

  // Pas de profil (compte non rattaché) ou compte désactivé : accès refusé.
  if (!profil || !profil.actif) {
    redirect("/connexion");
  }

  // Sélecteur d'agence : uniquement pour le super-admin (les autres n'ont rien
  // à basculer, on évite la requête).
  const agences = profil.superAdmin ? await listAgencesPourBascule() : [];

  return (
    <AppShell
      role={profil.role}
      userName={profil.nomComplet}
      agences={agences}
      agenceActiveId={profil.agenceId}
    >
      {children}
    </AppShell>
  );
}
