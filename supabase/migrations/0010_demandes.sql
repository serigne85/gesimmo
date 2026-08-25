-- =============================================================================
-- 0010 — Demandes clients (le pendant des biens, côté demande)
-- Ce qu'un client recherche : objectif (achat/location), zones, types, budget,
-- critères. À matcher ensuite avec les biens (l'offre). Le client est un
-- contact (modèle unique), trouvé/créé par téléphone comme le propriétaire d'un
-- bien. Zones et types multiples => deux tables de liaison, chacune porteuse de
-- agence_id (règle multi-agence de CLAUDE.md) pour une RLS simple et directe.
-- =============================================================================

create table if not exists public.demandes (
  id                  uuid primary key default gen_random_uuid(),
  agence_id           uuid not null references public.agences (id),
  contact_id          uuid not null references public.contacts (id),
  objectif            text not null check (objectif in ('achat','location')),
  budget_min          bigint,             -- FCFA
  budget_max          bigint,             -- FCFA
  nombre_chambres_min integer check (nombre_chambres_min is null or nombre_chambres_min >= 0),
  surface_min         integer check (surface_min is null or surface_min > 0),
  statut              text not null default 'active'
                      check (statut in ('active','satisfaite','annulee')),
  notes               text,
  cree_le             timestamptz not null default now(),
  supprime_le         timestamptz
);

-- Zones ciblées (plusieurs par demande).
create table if not exists public.demande_zones (
  agence_id  uuid not null references public.agences (id),
  demande_id uuid not null references public.demandes (id) on delete cascade,
  zone_id    uuid not null references public.zones (id),
  primary key (demande_id, zone_id)
);

-- Types de bien recherchés (plusieurs par demande).
create table if not exists public.demande_types (
  agence_id  uuid not null references public.agences (id),
  demande_id uuid not null references public.demandes (id) on delete cascade,
  type       text not null
             check (type in ('appartement','maison','villa','terrain','bureau',
                             'commerce','magasin','immeuble','studio','chambre','autre')),
  primary key (demande_id, type)
);

-- =============================================================================
-- Sécurité : GRANT + RLS
-- Rappel projet : aucun droit de table par défaut → GRANT explicites.
-- =============================================================================
grant select, insert, update on public.demandes to authenticated;
grant all on public.demandes to service_role;
-- Liaisons : on autorise DELETE pour rejouer les sélections (retirer une zone).
grant select, insert, delete on public.demande_zones, public.demande_types to authenticated;
grant all on public.demande_zones, public.demande_types to service_role;

alter table public.demandes      enable row level security;
alter table public.demande_zones enable row level security;
alter table public.demande_types enable row level security;

-- Demandes : cloisonnées par agence.
drop policy if exists "demandes_select" on public.demandes;
create policy "demandes_select" on public.demandes
  for select using (agence_id = public.agence_courante() and supprime_le is null);
drop policy if exists "demandes_insert" on public.demandes;
create policy "demandes_insert" on public.demandes
  for insert with check (agence_id = public.agence_courante());
drop policy if exists "demandes_update" on public.demandes;
create policy "demandes_update" on public.demandes
  for update using (agence_id = public.agence_courante());

-- Liaisons : mêmes règles, sur leur propre agence_id.
drop policy if exists "demande_zones_select" on public.demande_zones;
create policy "demande_zones_select" on public.demande_zones
  for select using (agence_id = public.agence_courante());
drop policy if exists "demande_zones_insert" on public.demande_zones;
create policy "demande_zones_insert" on public.demande_zones
  for insert with check (agence_id = public.agence_courante());
drop policy if exists "demande_zones_delete" on public.demande_zones;
create policy "demande_zones_delete" on public.demande_zones
  for delete using (agence_id = public.agence_courante());

drop policy if exists "demande_types_select" on public.demande_types;
create policy "demande_types_select" on public.demande_types
  for select using (agence_id = public.agence_courante());
drop policy if exists "demande_types_insert" on public.demande_types;
create policy "demande_types_insert" on public.demande_types
  for insert with check (agence_id = public.agence_courante());
drop policy if exists "demande_types_delete" on public.demande_types;
create policy "demande_types_delete" on public.demande_types
  for delete using (agence_id = public.agence_courante());
