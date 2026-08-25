/** Une photo de bien prête à afficher (URL signée temporaire). */
export type PhotoBien = {
  id: string;
  url: string;
  estPrincipale: boolean;
  ordre: number;
};
