import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  TYPES_MANDAT,
  TYPE_MANDAT_LABELS,
  type TypeMandat,
} from "@/types/mandat";
import type { ModeleMandat } from "@/types/modele-mandat";

/**
 * Renvoie les modèles de contrat de l'agence, un par nature de mandat. Une
 * nature sans modèle enregistré revient avec un titre par défaut et un corps
 * vide : l'éditeur affiche toujours les trois onglets.
 */
export async function listModelesMandats(): Promise<ModeleMandat[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("modeles_mandats")
    .select("type, titre, corps, maj_le");

  if (error) throw new Error(`Lecture des modèles impossible : ${error.message}`);

  const parType = new Map<string, Record<string, unknown>>();
  (data ?? []).forEach((m) =>
    parType.set(m.type as string, m as Record<string, unknown>)
  );

  return TYPES_MANDAT.map((t: TypeMandat) => {
    const row = parType.get(t);
    return {
      type: t,
      titre:
        (row?.titre as string) ??
        `Mandat de ${TYPE_MANDAT_LABELS[t].toLowerCase()}`,
      corps: (row?.corps as string) ?? "",
      majLe: (row?.maj_le as string | null) ?? null,
    };
  });
}
