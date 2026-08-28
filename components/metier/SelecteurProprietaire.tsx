"use client";

import { useRouter } from "next/navigation";
import type { ProprietaireOption } from "@/types/situation";
import { champClasse } from "./champsBien";

/**
 * Sélecteur de propriétaire : au changement, navigue vers la situation en gardant
 * le mois courant dans l'URL (l'état vit dans l'URL, partageable/rechargeable).
 */
export default function SelecteurProprietaire({
  proprietaires,
  valeur,
  mois,
}: {
  proprietaires: ProprietaireOption[];
  valeur: string | null;
  mois: string;
}) {
  const router = useRouter();

  return (
    <select
      value={valeur ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams({ mois });
        if (e.target.value) params.set("proprietaire", e.target.value);
        router.push(`/paiements/proprietaires?${params.toString()}`);
      }}
      className={`${champClasse} sm:max-w-xs`}
    >
      <option value="">Choisir un propriétaire…</option>
      {proprietaires.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nomComplet}
        </option>
      ))}
    </select>
  );
}
