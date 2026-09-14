/**
 * Fusionne un corps de modèle avec des variables : chaque `{{cle}}` est remplacé
 * par sa valeur. Les espaces autour de la clé sont tolérés (`{{ cle }}`). Une clé
 * sans valeur connue est laissée telle quelle, pour que l'agent repère la coquille
 * dans son modèle plutôt que d'obtenir un trou silencieux.
 */
export function fusionner(
  corps: string,
  variables: Record<string, string>
): string {
  return corps.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (motComplet, cle: string) => {
    const valeur = variables[cle];
    return valeur !== undefined ? valeur : motComplet;
  });
}
