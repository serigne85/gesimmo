-- =============================================================================
-- 0025 — Mises en relation : supporter le sens « entrante »
-- Sens 'entrante' : un partenaire amène un client pour UN DE NOS BIENS. Dans ce
-- cas il n'y a pas forcément de demande enregistrée chez nous (le client est
-- celui du partenaire). On rend donc `demande_id` nullable, et on garantit par
-- une contrainte la cohérence : une sortante pointe une demande, une entrante
-- pointe un bien.
-- =============================================================================

alter table public.mises_en_relation
  alter column demande_id drop not null;

-- Cohérence sortante/entrante. Les lignes existantes sont toutes 'sortante' avec
-- demande_id renseigné : elles satisfont déjà la contrainte.
alter table public.mises_en_relation
  drop constraint if exists mer_sens_coherence;
alter table public.mises_en_relation
  add constraint mer_sens_coherence check (
    (sens = 'sortante' and demande_id is not null)
    or (sens = 'entrante' and bien_id is not null)
  );
