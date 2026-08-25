-- =============================================================================
-- 0011 — Demandes : date de la demande et date d'échéance
-- `date_demande`  : quand le client a formulé sa recherche (≠ date de saisie
--                   `cree_le`). Par défaut aujourd'hui.
-- `date_echeance` : délai à tenir pour trouver un bien ; sert à traiter les
--                   demandes par priorité (tri par échéance croissante).
-- Pas de nouveau GRANT ni de RLS : droits accordés au niveau TABLE (0010).
-- =============================================================================

alter table public.demandes
  add column if not exists date_demande  date not null default current_date,
  add column if not exists date_echeance date;
