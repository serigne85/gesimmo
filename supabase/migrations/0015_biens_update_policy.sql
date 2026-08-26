-- =============================================================================
-- 0015 — Rétablit proprement les droits de mise à jour des biens
-- La suppression logique d'un bien (UPDATE supprime_le = now()) échouait avec
-- « new row violates row-level security policy » : la policy biens_update
-- réellement en base portait un WITH CHECK trop strict (la nouvelle ligne devait
-- rester non supprimée), divergeant de la migration 0002. On la ré-affirme de
-- façon idempotente, avec un WITH CHECK explicite limité à l'agence — la ligne
-- résultante peut donc porter supprime_le. Même correctif que 0012 pour demandes.
-- =============================================================================

grant select, insert, update on public.biens to authenticated;

alter table public.biens enable row level security;

drop policy if exists "biens_update" on public.biens;
create policy "biens_update" on public.biens
  for update
  using (agence_id = public.agence_courante())
  with check (agence_id = public.agence_courante());
