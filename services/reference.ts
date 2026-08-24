import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ZoneOption = {
  id: string;
  nom: string;
  villeId: string;
  villeNom: string;
};

/** Liste les zones (avec leur ville) pour alimenter les listes déroulantes. */
export async function listZones(): Promise<ZoneOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("zones")
    .select("id, nom, ville_id, villes(nom)")
    .order("nom", { ascending: true });

  if (error) throw new Error(`Lecture des zones impossible : ${error.message}`);

  const lignes = (data ?? []) as unknown as Record<string, unknown>[];
  return lignes.map((z) => {
    const ville = z.villes as { nom?: string } | { nom?: string }[] | null;
    const villeNom = Array.isArray(ville) ? ville[0]?.nom : ville?.nom;
    return {
      id: z.id as string,
      nom: z.nom as string,
      villeId: z.ville_id as string,
      villeNom: villeNom ?? "",
    };
  });
}
