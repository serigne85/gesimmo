-- =============================================================================
-- 0004 — Champs complémentaires des biens
-- Adresse précise, nombre de chambres, surface. Tous optionnels : ils
-- n'alourdissent pas la saisie rapide (5 champs obligatoires — CLAUDE.md).
-- Pas de nouveau GRANT ni de RLS ici : les droits sont accordés au niveau de
-- la TABLE (migration 0002) et couvrent automatiquement les colonnes ajoutées.
-- =============================================================================

alter table public.biens
  add column if not exists adresse        text,
  add column if not exists nombre_chambres integer
    check (nombre_chambres is null or nombre_chambres >= 0),
  add column if not exists surface_m2      integer
    check (surface_m2 is null or surface_m2 > 0);
