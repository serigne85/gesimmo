-- =============================================================================
-- 0027 — Rendez-vous / agenda (Lot 5)
-- L'agenda de l'agence. La VISITE est un TYPE de rendez-vous (décision CLAUDE.md :
-- pas de module de visites parallèle qui duplique date/heure/agent/statut). Son
-- compte rendu vit dans une table dédiée rattachée (0028).
--
-- Décisions structurantes (CLAUDE.md) :
--  - `agence_id` + RLS (SELECT = agence_id seul, cf 0016).
--  - Suppression logique (`supprime_le`).
--  - Dates en timestamptz ; `contact_id` (client) et `bien_id` optionnels
--    (une visite cible un bien, un rendez-vous de signature un contact, etc.).
-- =============================================================================

create table if not exists public.rendez_vous (
  id          uuid primary key default gen_random_uuid(),
  agence_id   uuid not null references public.agences (id),
  titre       text not null,
  type        text not null default 'rendez_vous'
              check (type in ('rendez_vous','visite','appel','signature','autre')),
  statut      text not null default 'planifie'
              check (statut in ('planifie','confirme','realise','annule','reporte')),
  debut       timestamptz not null,
  fin         timestamptz,
  lieu        text,
  contact_id  uuid references public.contacts (id),
  bien_id     uuid references public.biens (id),
  assignee_id uuid references public.utilisateurs (id),
  notes       text,
  cree_par    uuid references public.utilisateurs (id),
  cree_le     timestamptz not null default now(),
  supprime_le timestamptz,
  constraint rdv_fin_apres_debut check (fin is null or fin >= debut)
);

create index if not exists rdv_agence_idx   on public.rendez_vous (agence_id);
create index if not exists rdv_debut_idx     on public.rendez_vous (debut);
create index if not exists rdv_assignee_idx  on public.rendez_vous (assignee_id);
create index if not exists rdv_bien_idx      on public.rendez_vous (bien_id);
create index if not exists rdv_contact_idx   on public.rendez_vous (contact_id);

-- =============================================================================
-- Sécurité : GRANT + RLS (aucun droit par défaut ; sans GRANT, permission denied)
-- =============================================================================
grant select, insert, update on public.rendez_vous to authenticated;
grant all on public.rendez_vous to service_role;

alter table public.rendez_vous enable row level security;

drop policy if exists "rdv_select" on public.rendez_vous;
create policy "rdv_select" on public.rendez_vous
  for select using (agence_id = public.agence_courante());

drop policy if exists "rdv_insert" on public.rendez_vous;
create policy "rdv_insert" on public.rendez_vous
  for insert with check (agence_id = public.agence_courante());

drop policy if exists "rdv_update" on public.rendez_vous;
create policy "rdv_update" on public.rendez_vous
  for update using (agence_id = public.agence_courante());
