import type { TypeMandat } from "@/types/mandat";

/** Un modèle de contrat éditable, pour une nature de mandat. */
export type ModeleMandat = {
  type: TypeMandat;
  titre: string;
  corps: string;
  majLe: string | null;
};
