import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";

/**
 * Page 404 du site vitrine. S'affiche notamment quand une fiche bien n'existe
 * pas ou n'est plus disponible. Rendue dans le layout (site), donc avec
 * l'en-tête et le pied de page.
 */
export default function NonTrouve() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-bleu-profond/10 text-bleu-profond">
        <Home className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold text-stone-900">
        Page introuvable
      </h1>
      <p className="mt-3 text-stone-600">
        Ce bien n&apos;est plus disponible ou la page que vous cherchez n&apos;existe
        pas. Découvrez nos autres biens.
      </p>
      <Link
        href="/nos-biens"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-bleu-profond px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-bleu-profond-hover"
      >
        Voir nos biens <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
