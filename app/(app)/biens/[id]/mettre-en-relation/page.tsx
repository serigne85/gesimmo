import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBienById, listBiensOptions } from "@/services/biens";
import { listPartenairesOptions } from "@/services/partenaires";
import { TYPE_BIEN_LABELS } from "@/types/bien";
import FormulaireMiseEnRelation from "@/components/metier/FormulaireMiseEnRelation";

/**
 * Met un bien en relation avec un partenaire (sens entrante : le partenaire
 * amène un client pour ce bien). Server Component : on charge le bien (contexte),
 * les partenaires actifs et la liste des biens proposables (pour le sélecteur,
 * pré-positionné sur le bien courant).
 */
export default async function MettreEnRelationBienPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [bien, partenaires, biens] = await Promise.all([
    getBienById(id),
    listPartenairesOptions(),
    listBiensOptions(),
  ]);
  if (!bien) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href={`/biens/${id}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour au bien
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Mettre en relation avec un partenaire
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {bien.reference} · {bien.titre || TYPE_BIEN_LABELS[bien.type]}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulaireMiseEnRelation
          sens="entrante"
          bienId={id}
          biens={biens}
          partenaires={partenaires}
        />
      </div>
    </div>
  );
}
