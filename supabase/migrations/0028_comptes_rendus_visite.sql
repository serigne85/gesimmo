-- =============================================================================
-- 0028 — Comptes rendus de visite (Lot 5)
-- Fiche rattachée à un rendez-vous de type 'visite' (cf 0027). On ne duplique ni
-- date, ni heure, ni agent, ni statut : tout ça vit sur le rendez-vous. Ici,
-- uniquement le résultat de la visite : intérêt du client, compte rendu, suite.
-- Un rendez-vous a au plus un compte rendu (unicité sur rendez_vous_id).
--
-- Décisions structurantes (CLAUDE.md) :
--  - `agence_id` + RLS (SELECT = agence_id seul, cf 0016).
--  - Pas de soft-delete : c'est une note liée au rendez-vous ; on l'édite.
-- =============================================================================

create table if not exists public.comptes_rendus_visite (
  id             uuid primary key default gen_random_uuid(),
  agence_id      uuid not null references public.agences (id),
  rendez_vous_id uuid not null references public.rendez_vous (id) on delete cascade,
  interesse      boolean,
  niveau_interet text check (niveau_interet in ('faible','moyen','fort')),
  compte_rendu   text not null,
  suite_a_donner text,
  cree_par       uuid references public.utilisateurs (id),
  cree_le        timestamptz not null default now(),
  maj_le         timestamptz not null default now(),
  unique (rendez_vous_id)
);

create index if not exists crv_agence_idx on public.comptes_rendus_visite (agence_id);

-- =============================================================================
-- Sécurité : GRANT + RLS (aucun droit par défaut ; sans GRANT, permission denied)
-- =============================================================================
grant select, insert, update on public.comptes_rendus_visite to authenticated;
grant all on public.comptes_rendus_visite to service_role;

alter table public.comptes_rendus_visite enable row level security;

drop policy if exists "crv_select" on public.comptes_rendus_visite;
create policy "crv_select" on public.comptes_rendus_visite
  for select using (agence_id = public.agence_courante());

drop policy if exists "crv_insert" on public.comptes_rendus_visite;
create policy "crv_insert" on public.comptes_rendus_visite
  for insert with check (agence_id = public.agence_courante());

drop policy if exists "crv_update" on public.comptes_rendus_visite;
create policy "crv_update" on public.comptes_rendus_visite
  for update using (agence_id = public.agence_courante());
