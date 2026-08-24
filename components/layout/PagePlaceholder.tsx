/**
 * Squelette d'une page encore vide (titre + mention "à venir").
 *
 * Server Component : purement d'affichage, aucune interactivité. On le
 * factorise ici pour ne pas répéter la même structure dans chaque page.tsx.
 * Il sera remplacé par le vrai contenu métier au fil de la roadmap.
 */
export default function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {description ?? "Module à venir."}
      </p>
    </div>
  );
}
