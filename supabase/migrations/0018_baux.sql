-- =============================================================================
-- 0018 — Baux (gestion locative)
-- Un bail loue un bien (objectif = location) à un locataire (un contact).
-- Il peut se rattacher à un mandat de location/gérance (optionnel), et pointer
-- une durée (date_debut / date_fin toutes deux optionnelles en V1).
-- Cycle de vie : brouillon → actif → resilie | expire | archive.
--
-- Décisions structurantes (CLAUDE.md) :
--  - Montants en bigint FCFA (jamais de float, pas de centimes).
--  - `caution_mois` = un NOMBRE de mois de loyer, pas un montant (le montant se
--    calcule dans services/).
--  - Suppression logique via `supprime_le` (jamais de DELETE physique).
--  - `agence_id` + RLS sur toutes les tables métier.
-- =============================================================================

create table if not exists public.baux (
  id             uuid primary key default gen_random_uuid(),
  agence_id      uuid not null references public.agences (id),
  reference      text not null,                       -- BX-AAAA-0001
  bien_id        uuid not null references public.biens (id),
  locataire_id   uuid not null references public.contacts (id),
  mandat_id      uuid references public.mandats (id),  -- optionnel

  date_debut     date,                                -- optionnels en V1
  date_fin       date,

  loyer_mensuel      bigint not null,                 -- FCFA
  charges_mensuelles bigint not null default 0,       -- FCFA
  caution_mois       numeric,                         -- NOMBRE de mois, pas un montant
  jour_echeance      smallint not null default 1
                     check (jour_echeance between 1 and 28),

  mode_paiement  text
                 check (mode_paiement in
                   ('especes','wave','orange_money','virement','cheque','depot_bancaire')),

  statut         text not null default 'brouillon'
                 check (statut in ('brouillon','actif','resilie','expire','archive')),

  notes          text,
  cree_le        timestamptz not null default now(),
  supprime_le    timestamptz
);

-- Référence unique par agence (BX-AAAA-0001).
create unique index if not exists baux_agence_reference_unique
  on public.baux (agence_id, reference);

-- Accès fréquent : les baux d'un bien (contrôle « un seul bail actif »).
create index if not exists baux_bien_idx on public.baux (bien_id);

-- =============================================================================
-- Sécurité : GRANT + RLS
-- Rappel projet : aucun droit de table n'est accordé par défaut. Sans ces GRANT
-- explicites, même service_role reçoit « permission denied ».
-- =============================================================================
grant select, insert, update on public.baux to authenticated;
grant all on public.baux to service_role;

alter table public.baux enable row level security;

-- SELECT = agence_id SEUL. Surtout PAS de `supprime_le is null` ici : lors d'un
-- UPDATE, PostgreSQL exige que la ligne résultante reste visible selon la policy
-- SELECT. Un « UPDATE supprime_le = now() » produirait une ligne non visible et
-- casserait la suppression logique (42501). Le masquage des lignes supprimées se
-- fait au niveau requête (`.is("supprime_le", null)` dans les services).
drop policy if exists "baux_select" on public.baux;
create policy "baux_select" on public.baux
  for select using (agence_id = public.agence_courante());

drop policy if exists "baux_insert" on public.baux;
create policy "baux_insert" on public.baux
  for insert with check (agence_id = public.agence_courante());

drop policy if exists "baux_update" on public.baux;
create policy "baux_update" on public.baux
  for update using (agence_id = public.agence_courante());
