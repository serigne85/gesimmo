-- =============================================================================
-- 0031 — Texte du contrat de mandat
-- Le contrat généré (modèle fusionné + données), tel que l'agent l'a éventuellement
-- retouché. Stocké sur le mandat pour être réimprimé à l'identique. Vide tant que
-- le contrat n'a pas été généré/enregistré.
-- =============================================================================

alter table public.mandats
  add column if not exists contrat_texte  text,
  add column if not exists contrat_maj_le timestamptz;

comment on column public.mandats.contrat_texte is
  'Texte final du contrat de mandat (modèle fusionné, éventuellement retouché). Réimprimable à l''identique.';

-- Aucun GRANT ni policy à ajouter : mandats accorde déjà update à authenticated,
-- la RLS cloisonne par agence.
