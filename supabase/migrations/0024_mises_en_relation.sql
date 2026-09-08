-- =============================================================================
-- 0024 — Mises en relation avec les partenaires, et leur suivi
-- Cœur de l'apport d'affaires : une demande client est soumise à un partenaire
-- (sens 'sortante'), OU un partenaire amène un client pour un de nos biens
-- (sens 'entrante'). On suit l'affaire de la soumission à la conclusion, et on
-- trace la commission — partagée entre l'agence et le partenaire (co-courtage).
--
-- Deux tables :
--  - `mises_en_relation`      : l'affaire elle-même (statut, montants, dates).
--  - `suivi_mises_en_relation`: le journal chronologique (chaque événement = 1 ligne).
--
-- Décisions structurantes (CLAUDE.md) :
--  - Montants en bigint FCFA (jamais float/décimal). Un taux (%) resterait numeric,
--    mais ici on stocke des MONTANTS déjà calculés, pas des taux.
--  - Suppression logique sur l'affaire (écriture financière une fois conclue).
--    Le journal, lui, n'est pas soft-deleté : c'est une trace append-only.
--  - `agence_id` + RLS ; SELECT = agence_id seul (cf. 0016).
--  - Le recalcul du statut de la `demande` (→ 'satisfaite' quand une mise en
--    relation est 'conclue') se fait dans services/, pas ici et pas en trigger :
--    il dépend de règles métier susceptibles d'évoluer.
-- =============================================================================

create table if not exists public.mises_en_relation (
  id                    uuid primary key default gen_random_uuid(),
  agence_id             uuid not null references public.agences (id),
  demande_id            uuid not null references public.demandes (id),
  partenaire_id         uuid not null references public.partenaires (id),
  sens                  text not null default 'sortante'
                        check (sens in ('sortante','entrante')),
  -- Sortante : le partenaire propose un produit qui n'est pas dans NOS biens →
  -- on le décrit en clair. Entrante : le produit est un de nos biens → bien_id.
  bien_propose          text,
  bien_id               uuid references public.biens (id),
  statut                text not null default 'soumise'
                        check (statut in ('soumise','proposition_recue','visite',
                                          'en_negociation','conclue','echouee','annulee')),
  -- Commission (FCFA). Prévu au montage, encaissé à la conclusion.
  commission_totale     bigint,   -- commission globale de l'affaire (prévue)
  part_agence           bigint,   -- part revenant à M2S (prévue)
  part_partenaire       bigint,   -- part revenant au partenaire (prévue)
  commission_percue     bigint,   -- ce que M2S a RÉELLEMENT encaissé
  date_soumission       timestamptz not null default now(),
  date_conclusion       timestamptz,
  cree_par              uuid references public.utilisateurs (id),
  cree_le               timestamptz not null default now(),
  supprime_le           timestamptz
);

create index if not exists mer_agence_idx     on public.mises_en_relation (agence_id);
create index if not exists mer_demande_idx     on public.mises_en_relation (demande_id);
create index if not exists mer_partenaire_idx  on public.mises_en_relation (partenaire_id);

-- Journal de l'affaire : chaque appel, proposition, visite, changement de statut
-- ou encaissement empile une ligne. Donne la chronologie complète du suivi.
create table if not exists public.suivi_mises_en_relation (
  id                   uuid primary key default gen_random_uuid(),
  agence_id            uuid not null references public.agences (id),
  mise_en_relation_id  uuid not null references public.mises_en_relation (id) on delete cascade,
  type                 text not null default 'note'
                       check (type in ('note','appel','proposition','visite','offre',
                                       'changement_statut','commission')),
  description          text not null,
  date_evenement       timestamptz not null default now(),
  cree_par             uuid references public.utilisateurs (id),
  cree_le              timestamptz not null default now()
);

create index if not exists suivi_mer_idx
  on public.suivi_mises_en_relation (mise_en_relation_id);

-- =============================================================================
-- Sécurité : GRANT + RLS (aucun droit par défaut ; sans GRANT, permission denied)
-- =============================================================================
grant select, insert, update on public.mises_en_relation to authenticated;
grant all on public.mises_en_relation to service_role;
-- Le journal est append-only : select + insert, pas d'update ni de delete.
grant select, insert on public.suivi_mises_en_relation to authenticated;
grant all on public.suivi_mises_en_relation to service_role;

alter table public.mises_en_relation       enable row level security;
alter table public.suivi_mises_en_relation enable row level security;

-- Mises en relation : cloisonnées par agence.
drop policy if exists "mer_select" on public.mises_en_relation;
create policy "mer_select" on public.mises_en_relation
  for select using (agence_id = public.agence_courante());

drop policy if exists "mer_insert" on public.mises_en_relation;
create policy "mer_insert" on public.mises_en_relation
  for insert with check (agence_id = public.agence_courante());

drop policy if exists "mer_update" on public.mises_en_relation;
create policy "mer_update" on public.mises_en_relation
  for update using (agence_id = public.agence_courante());

-- Journal : même cloisonnement.
drop policy if exists "suivi_mer_select" on public.suivi_mises_en_relation;
create policy "suivi_mer_select" on public.suivi_mises_en_relation
  for select using (agence_id = public.agence_courante());

drop policy if exists "suivi_mer_insert" on public.suivi_mises_en_relation;
create policy "suivi_mer_insert" on public.suivi_mises_en_relation
  for insert with check (agence_id = public.agence_courante());
