-- =============================================================================
-- 0026 — Tâches (Lot 5)
-- Point unique où l'agent consulte ce qu'il a à faire. Une RELANCE est une tâche
-- de type 'relance' (décision CLAUDE.md : pas de module de relances parallèle).
-- Les alertes automatiques (mandat expirant, loyer impayé, bien dormant)
-- viendront créer des tâches ici plus tard (Lot 8).
--
-- Lien polymorphe optionnel (`lien_type` + `lien_id`) : permet de rattacher une
-- tâche à un bien, un contact, un mandat, une demande, un bail, un partenaire ou
-- une mise en relation, pour naviguer depuis la tâche. Volontairement souple
-- (pas de FK), car il pointe vers des tables variées.
--
-- Décisions structurantes (CLAUDE.md) :
--  - `agence_id` + RLS (SELECT = agence_id seul, cf 0016).
--  - Suppression logique (`supprime_le`).
--  - `assignee_id` = utilisateur responsable ; le statut se pilote, `fait_le` est
--    horodaté à l'achèvement.
-- =============================================================================

create table if not exists public.taches (
  id            uuid primary key default gen_random_uuid(),
  agence_id     uuid not null references public.agences (id),
  titre         text not null,
  description   text,
  type          text not null default 'autre'
                check (type in ('relance','appel','administratif','autre')),
  priorite      text not null default 'normale'
                check (priorite in ('basse','normale','haute')),
  statut        text not null default 'a_faire'
                check (statut in ('a_faire','en_cours','faite','annulee')),
  date_echeance timestamptz,
  fait_le       timestamptz,
  assignee_id   uuid references public.utilisateurs (id),
  lien_type     text check (lien_type in
                  ('bien','contact','mandat','demande','bail','partenaire',
                   'mise_en_relation')),
  lien_id       uuid,
  cree_par      uuid references public.utilisateurs (id),
  cree_le       timestamptz not null default now(),
  supprime_le   timestamptz,
  -- Cohérence : un lien est soit complet (type + id), soit absent.
  constraint taches_lien_coherence check (
    (lien_type is null and lien_id is null)
    or (lien_type is not null and lien_id is not null)
  )
);

create index if not exists taches_agence_idx    on public.taches (agence_id);
create index if not exists taches_assignee_idx  on public.taches (assignee_id);
create index if not exists taches_echeance_idx  on public.taches (date_echeance);
create index if not exists taches_lien_idx      on public.taches (lien_type, lien_id);

-- =============================================================================
-- Sécurité : GRANT + RLS (aucun droit par défaut ; sans GRANT, permission denied)
-- =============================================================================
grant select, insert, update on public.taches to authenticated;
grant all on public.taches to service_role;

alter table public.taches enable row level security;

drop policy if exists "taches_select" on public.taches;
create policy "taches_select" on public.taches
  for select using (agence_id = public.agence_courante());

drop policy if exists "taches_insert" on public.taches;
create policy "taches_insert" on public.taches
  for insert with check (agence_id = public.agence_courante());

drop policy if exists "taches_update" on public.taches;
create policy "taches_update" on public.taches
  for update using (agence_id = public.agence_courante());
