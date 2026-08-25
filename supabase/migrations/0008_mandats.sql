-- =============================================================================
-- 0008 — Mandats (vente, location, gérance)
-- Un seul modèle pour les trois natures (CLAUDE.md) : les champs sont communs à
-- ~80 %. Un mandat relie un bien et un mandant (le contact propriétaire).
-- Cycle de vie : brouillon → en_attente_signature → actif → expire|resilie|archive.
-- La rémunération est générique : une valeur + une unité (pourcentage | mois |
-- montant), le montant réel se calcule dans services/ selon l'unité.
-- =============================================================================

create table if not exists public.mandats (
  id             uuid primary key default gen_random_uuid(),
  agence_id      uuid not null references public.agences (id),
  reference      text not null,
  bien_id        uuid not null references public.biens (id),
  mandant_id     uuid not null references public.contacts (id),
  type           text not null check (type in ('vente','location','gerance')),
  exclusif       boolean not null default false,
  date_debut     date,
  date_fin       date,
  statut         text not null default 'brouillon'
                 check (statut in ('brouillon','en_attente_signature','actif',
                                   'expire','resilie','archive')),
  commission_valeur numeric,
  commission_unite  text
                    check (commission_unite in ('pourcentage','mois','montant')),
  notes          text,
  cree_le        timestamptz not null default now(),
  supprime_le    timestamptz
);

-- Référence unique par agence (MN-AAAA-0001).
create unique index if not exists mandats_agence_reference_unique
  on public.mandats (agence_id, reference);

-- =============================================================================
-- Sécurité : GRANT + RLS
-- Rappel projet : aucun droit de table n'est accordé par défaut. Sans ces GRANT
-- explicites, même service_role reçoit « permission denied ».
-- =============================================================================
grant select, insert, update on public.mandats to authenticated;
grant all on public.mandats to service_role;

alter table public.mandats enable row level security;

drop policy if exists "mandats_select" on public.mandats;
create policy "mandats_select" on public.mandats
  for select using (agence_id = public.agence_courante() and supprime_le is null);
drop policy if exists "mandats_insert" on public.mandats;
create policy "mandats_insert" on public.mandats
  for insert with check (agence_id = public.agence_courante());
drop policy if exists "mandats_update" on public.mandats;
create policy "mandats_update" on public.mandats
  for update using (agence_id = public.agence_courante());
