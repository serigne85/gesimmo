import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getUtilisateurConnecte } from "@/services/auth";
import { estAdminOuDirection } from "@/types/roles";
import { listPipelinesAdmin } from "@/services/opportunites";
import GestionPipelines from "@/components/metier/GestionPipelines";

/**
 * Administration des pipelines et de leurs étapes. Réservé à admin/direction
 * (contrôle serveur). Les étapes de type « gain » / « perte » sont terminales :
 * y déplacer une opportunité la marque gagnée / perdue.
 */
export default async function AdminPipelinesPage() {
  const profil = await getUtilisateurConnecte();
  if (!profil || !profil.actif || !estAdminOuDirection(profil.role)) {
    redirect("/opportunites");
  }

  const pipelines = await listPipelinesAdmin();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/opportunites"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Opportunités
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Pipelines
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Configurez les étapes de vos flux. Une étape « gain » ou « perte »
          conclut l&apos;opportunité qui y arrive.
        </p>
      </div>

      <GestionPipelines pipelines={pipelines} />
    </div>
  );
}
