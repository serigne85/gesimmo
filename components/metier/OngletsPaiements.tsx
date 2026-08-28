import Link from "next/link";

/**
 * Onglets du module Paiements : suivi par échéance (existant) et situation par
 * propriétaire. Server Component : chaque page passe l'onglet actif.
 */
export default function OngletsPaiements({
  actif,
}: {
  actif: "echeances" | "proprietaires";
}) {
  const base = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  const on = "bg-blue-900 text-white";
  const off =
    "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900";

  return (
    <div className="flex gap-2">
      <Link href="/paiements" className={`${base} ${actif === "echeances" ? on : off}`}>
        Par échéance
      </Link>
      <Link
        href="/paiements/proprietaires"
        className={`${base} ${actif === "proprietaires" ? on : off}`}
      >
        Par propriétaire
      </Link>
    </div>
  );
}
