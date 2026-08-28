-- =============================================================================
-- 0021 — Marqueur de relance sur les échéances
-- CLAUDE.md prévoit que « les relances sont des tâches ». Le module Tâches
-- (Lot 5) n'existant pas encore, on ne crée PAS de module de relances parallèle.
-- On pose seulement un marqueur léger : la date de dernière relance, pour tracer
-- au suivi des loyers qui a été contacté. Il se fondra dans une vraie tâche quand
-- le Lot 5 arrivera.
-- =============================================================================

alter table public.echeances_loyer
  add column if not exists derniere_relance_le timestamptz;
