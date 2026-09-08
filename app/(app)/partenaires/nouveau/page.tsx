import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FormulairePartenaire from "@/components/metier/FormulairePartenaire";

/** Écran de saisie d'un partenaire (agence confrère ou courtier). */
export default function NouveauPartenairePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/partenaires"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux partenaires
      </Link>

      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Nouveau partenaire
      </h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <FormulairePartenaire />
      </div>
    </div>
  );
}
