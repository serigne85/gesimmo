-- =============================================================================
-- 0007 — Cycle de vie : nouveaux statuts + date de relance
-- Ajoute deux statuts au cycle de vie du bien : `perdu` et `a_relancer`.
-- `date_relance` : date de relance prévue, pertinente quand statut = 'a_relancer'.
--
-- NOTE PROVISOIRE (CLAUDE.md) : « à relancer » relève normalement d'une TÂCHE
-- (les relances sont des tâches, Lot 5). En attendant ce module, on stocke la
-- relance sur le bien. À migrer vers une vraie tâche au Lot 5.
--
-- Pas de nouveau GRANT ni de RLS : droits accordés au niveau TABLE (0002).
-- =============================================================================

-- Le CHECK du statut est posé en ligne dans 0002 (nom auto `biens_statut_check`).
-- On le remplace pour inclure les deux nouveaux statuts.
alter table public.biens drop constraint if exists biens_statut_check;
alter table public.biens add constraint biens_statut_check
  check (statut in ('prospecte','sous_mandat','disponible','sous_offre',
                    'vendu','loue','suspendu','archive','perdu','a_relancer'));

alter table public.biens
  add column if not exists date_relance date;
