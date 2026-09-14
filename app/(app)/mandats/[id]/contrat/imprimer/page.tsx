import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getMandatContrat, genererContratMandat } from "@/services/contrats";
import BoutonImprimer from "@/components/metier/BoutonImprimer";

/**
 * Contrat de mandat prêt à imprimer. Server Component (RLS active). Affiche le
 * texte enregistré (retouché) ou, à défaut, le texte fusionné depuis le modèle.
 * L'impression passe par le navigateur (Enregistrer en PDF possible).
 */
export default async function ImprimerContratMandatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mandat = await getMandatContrat(id);
  if (!mandat) notFound();

  const texte = mandat.contratTexte ?? genererContratMandat(mandat);
  const vide = texte.trim() === "";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/mandats/${id}/contrat`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour à l&apos;édition
        </Link>
        {!vide && <BoutonImprimer />}
      </div>

      {vide ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Le contrat est vide. Définissez d&apos;abord le modèle, puis générez le
          contrat depuis l&apos;écran d&apos;édition.
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-300 bg-white p-8 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 print:rounded-none print:border-0 print:p-0 print:text-black">
          {/* En-tête agence */}
          <div className="mb-6 border-b border-zinc-200 pb-4 dark:border-zinc-700 print:border-zinc-300">
            <p className="text-lg font-semibold">{mandat.agenceNom}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 print:text-zinc-600">
              {mandat.modeleTitre} · {mandat.reference}
            </p>
          </div>

          {/* Corps du contrat */}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{texte}</div>
        </div>
      )}
    </div>
  );
}
