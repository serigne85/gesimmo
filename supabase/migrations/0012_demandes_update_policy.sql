-- =============================================================================
-- 0012 — Rétablit proprement les droits de mise à jour des demandes
-- L'UPDATE en tant qu'`authenticated` échouait (0 ligne) : la policy et/ou le
-- GRANT d'UPDATE n'étaient pas effectifs sur la base. On les ré-affirme de façon
-- idempotente, avec un WITH CHECK explicite (la nouvelle ligne doit rester dans
-- l'agence). Cela permet au code de repasser par la RLS standard (client de
-- session) au lieu du service_role pour supprimer / modifier une demande.
-- =============================================================================

grant select, insert, update on public.demandes to authenticated;

alter table public.demandes enable row level security;

drop policy if exists "demandes_update" on public.demandes;
create policy "demandes_update" on public.demandes
  for update
  using (agence_id = public.agence_courante())
  with check (agence_id = public.agence_courante());
