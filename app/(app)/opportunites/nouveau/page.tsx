import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getUtilisateurConnecte } from "@/services/auth";
import { listPipelines } from "@/services/opportunites";
import { listBiensOptions } from "@/services/biens";
import { listContactsOptions } from "@/services/contacts";
import { listUtilisateursOptions } from "@/services/utilisateurs";
import FormulaireOpportunite from "@/components/metier/FormulaireOpportunite";

/**
 * Création d'une opportunité. Les listes (pipelines, biens, contacts,
 * responsables) sont chargées en parallèle côté serveur. Les paramètres d'URL
 * (bien, contact, demande, titre) permettent un pré-remplissage contextuel
 * (bouton depuis une demande ou un bien, à câbler à l'étape suivante).
 */
export default async function NouvelleOpportunitePage({
  searchParams,
}: {
  searchParams: Promise<{
    bienId?: string;
    contactId?: string;
    demandeId?: string;
    titre?: string;
  }>;
}) {
  const profil = await getUtilisateurConnecte();
  // Réservé aux rôles commerciaux (cf. lib/navigation.ts). Contrôle serveur.
  if (
    !profil ||
    !profil.actif ||
    !["admin", "direction", "agent"].includes(profil.role)
  ) {
    redirect("/opportunites");
  }

  const sp = await searchParams;
  const [pipelines, biens, contacts, responsables] = await Promise.all([
    listPipelines(),
    listBiensOptions(),
    listContactsOptions(),
    listUtilisateursOptions(profil.agenceId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/opportunites"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Opportunités
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Nouvelle opportunité
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Une affaire à suivre d&apos;étape en étape jusqu&apos;à sa conclusion.
        </p>
      </div>

      <FormulaireOpportunite
        pipelines={pipelines}
        biens={biens}
        contacts={contacts}
        responsables={responsables}
        prefillTitre={sp.titre}
        prefillBienId={sp.bienId}
        prefillContactId={sp.contactId}
        prefillDemandeId={sp.demandeId}
      />
    </div>
  );
}
