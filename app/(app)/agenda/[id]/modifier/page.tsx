import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRendezVousById } from "@/services/rendez-vous";
import { getUtilisateurConnecte } from "@/services/auth";
import { listUtilisateursOptions } from "@/services/utilisateurs";
import { listContactsOptions } from "@/services/contacts";
import { listBiensOptions } from "@/services/biens";
import FormulaireRendezVous from "@/components/metier/FormulaireRendezVous";

/** Écran d'édition d'un rendez-vous. Server Component (RLS active). */
export default async function ModifierRendezVousPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profil = await getUtilisateurConnecte();
  const [rdv, contacts, biens, utilisateurs] = await Promise.all([
    getRendezVousById(id),
    listContactsOptions(),
    listBiensOptions(),
    profil ? listUtilisateursOptions(profil.agenceId) : Promise.resolve([]),
  ]);
  if (!rdv) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={`/agenda/${id}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour au rendez-vous
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Modifier le rendez-vous
      </h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulaireRendezVous
          contacts={contacts}
          biens={biens}
          utilisateurs={utilisateurs}
          rendezVous={rdv}
        />
      </div>
    </div>
  );
}
