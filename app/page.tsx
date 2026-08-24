import { redirect } from "next/navigation";

/**
 * Racine du site. Pour l'instant, on envoie directement vers le tableau de bord.
 * Plus tard (auth), la redirection dépendra de l'état de connexion.
 */
export default function Home() {
  redirect("/tableau-de-bord");
}
