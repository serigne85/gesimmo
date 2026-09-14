import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getMandatContrat, genererContratMandat } from "@/services/contrats";
import { TYPE_MANDAT_LABELS } from "@/types/mandat";
import EditeurContratMandat from "@/components/metier/EditeurContratMandat";

/** Rédaction du contrat d'un mandat. Server Component (RLS active). */
export default async function ContratMandatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mandat = await getMandatContrat(id);
  if (!mandat) notFound();

  const texteModele = genererContratMandat(mandat);
  const texteInitial = mandat.contratTexte ?? texteModele;
  const modeleVide = mandat.modeleCorps.trim() === "";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/mandats"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux mandats
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Contrat · {mandat.reference}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {TYPE_MANDAT_LABELS[mandat.type]} · {mandat.mandant.nomComplet} ·{" "}
          {mandat.bien.reference}
          {mandat.bien.titre ? ` · ${mandat.bien.titre}` : ""}
        </p>
      </div>

      <EditeurContratMandat
        mandatId={mandat.id}
        texteInitial={texteInitial}
        texteModele={texteModele}
        modeleVide={modeleVide}
      />
    </div>
  );
}
