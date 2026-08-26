-- =============================================================================
-- 0016 — Débloque la suppression logique (biens + demandes)
-- Cause racine : les policies SELECT portaient `supprime_le IS NULL`. Or lors
-- d'un UPDATE, PostgreSQL exige que la ligne RÉSULTANTE reste visible selon la
-- policy SELECT. La suppression logique (UPDATE supprime_le = now()) produisait
-- une ligne non visible -> rejet « new row violates row-level security policy »
-- (42501). Les migrations 0012/0015 avaient corrigé la policy UPDATE, mais le
-- vrai verrou était côté SELECT.
--
-- Correctif : on retire `supprime_le IS NULL` des policies SELECT. Le masquage
-- des lignes supprimées est déjà assuré au niveau requête (`.is("supprime_le",
-- null)` dans les services). L'isolation par agence reste garantie par la RLS.
-- Le site vitrine passe par le service_role (contourne la RLS) et filtre déjà
-- `supprime_le` : il n'est pas concerné.
-- =============================================================================

drop policy if exists "biens_select" on public.biens;
create policy "biens_select" on public.biens
  for select using (agence_id = public.agence_courante());

drop policy if exists "demandes_select" on public.demandes;
create policy "demandes_select" on public.demandes
  for select using (agence_id = public.agence_courante());
