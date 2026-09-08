import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTacheById } from "@/services/taches";
import { getUtilisateurConnecte } from "@/services/auth";
import { listUtilisateursOptions } from "@/services/utilisateurs";
import FormulaireTache from "@/components/metier/FormulaireTache";

/** Écran d'édition d'une tâche. Server Component (RLS active). */
export default async function ModifierTachePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tache, profil] = await Promise.all([
    getTacheById(id),
    getUtilisateurConnecte(),
  ]);
  if (!tache) notFound();
  const utilisateurs = profil
    ? await listUtilisateursOptions(profil.agenceId)
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={`/taches/${id}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour à la tâche
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Modifier la tâche
      </h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulaireTache utilisateurs={utilisateurs} tache={tache} />
      </div>
    </div>
  );
}
