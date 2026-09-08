import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUtilisateurConnecte } from "@/services/auth";
import { listUtilisateursOptions } from "@/services/utilisateurs";
import { listContactsOptions } from "@/services/contacts";
import { listBiensOptions } from "@/services/biens";
import {
  TYPE_RENDEZ_VOUS_LABELS,
  type TypeRendezVous,
} from "@/types/rendez-vous";
import FormulaireRendezVous, {
  type PrefillRendezVous,
} from "@/components/metier/FormulaireRendezVous";

/**
 * Création d'un rendez-vous. Server Component : charge en parallèle contacts,
 * biens et utilisateurs de l'agence. Préremplissage optionnel via l'URL (type,
 * bienId, contactId, titre) pour planifier depuis une fiche.
 */
export default async function NouveauRendezVousPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    bienId?: string;
    contactId?: string;
    titre?: string;
  }>;
}) {
  const sp = await searchParams;
  const profil = await getUtilisateurConnecte();
  const [contacts, biens, utilisateurs] = await Promise.all([
    listContactsOptions(),
    listBiensOptions(),
    profil ? listUtilisateursOptions(profil.agenceId) : Promise.resolve([]),
  ]);

  const type =
    sp.type && sp.type in TYPE_RENDEZ_VOUS_LABELS
      ? (sp.type as TypeRendezVous)
      : undefined;
  const prefill: PrefillRendezVous | undefined =
    type || sp.bienId || sp.contactId || sp.titre
      ? { type, bienId: sp.bienId, contactId: sp.contactId, titre: sp.titre }
      : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/agenda"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour à l&apos;agenda
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Nouveau rendez-vous
      </h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulaireRendezVous
          contacts={contacts}
          biens={biens}
          utilisateurs={utilisateurs}
          prefill={prefill}
        />
      </div>
    </div>
  );
}
