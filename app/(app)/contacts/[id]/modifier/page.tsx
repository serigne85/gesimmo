import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getContactIdentite } from "@/services/contacts";
import FormulaireIdentiteContact from "@/components/metier/FormulaireIdentiteContact";

/** Édition de l'identité civile d'un contact. Server Component (RLS active). */
export default async function ModifierContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContactIdentite(id);
  if (!contact) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href={`/contacts/${id}`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour à la fiche
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Identité civile
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Informations utilisées dans les contrats (mandats et baux)
        </p>
      </div>

      <FormulaireIdentiteContact contact={contact} />
    </div>
  );
}
