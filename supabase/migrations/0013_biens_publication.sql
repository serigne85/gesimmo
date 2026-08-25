-- =============================================================================
-- 0013 — Publication sur le site vitrine
-- Indicateur EXPLICITE de publication. Un bien apparaît sur le site public
-- seulement s'il est `disponible` ET `publie`. `publie_le` = horodatage de mise
-- en ligne (informatif).
--
-- REPRISE : jusqu'ici, tout bien `disponible` était automatiquement public. Pour
-- ne pas vider le site, on marque publiés les biens actuellement disponibles.
--
-- Pas de nouveau GRANT ni de RLS : droits accordés au niveau TABLE (0002).
-- =============================================================================

alter table public.biens
  add column if not exists publie    boolean not null default false,
  add column if not exists publie_le timestamptz;

-- Les biens actuellement disponibles restent visibles sur le site public.
update public.biens
  set publie = true, publie_le = now()
  where statut = 'disponible'
    and supprime_le is null
    and publie = false;
