import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDemandeById } from "@/services/demandes";
import { listPartenairesOptions } from "@/services/partenaires";
import { OBJECTIF_DEMANDE_LABELS } from "@/types/demande";
import FormulaireMiseEnRelation from "@/components/metier/FormulaireMiseEnRelation";

/**
 * Soumet une demande à un partenaire (crée une mise en relation). Server
 * Component : on charge la demande (contexte) et les partenaires actifs, puis
 * on passe la main au formulaire client.
 */
export default async function SoumettreDemandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [demande, partenaires] = await Promise.all([
    getDemandeById(id),
    listPartenairesOptions(),
  ]);
  if (!demande) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={`/demandes/${id}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour à la demande
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Soumettre à un partenaire
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {demande.clientNom} · {OBJECTIF_DEMANDE_LABELS[demande.objectif]}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulaireMiseEnRelation
          sens="sortante"
          demandeId={id}
          partenaires={partenaires}
        />
      </div>
    </div>
  );
}
