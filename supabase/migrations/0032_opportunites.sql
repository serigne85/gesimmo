-- =============================================================================
-- 0032 — Opportunités + pipelines configurables
-- L'opportunité est une AFFAIRE en cours qu'on fait avancer d'étape en étape
-- jusqu'à sa conclusion. À distinguer : Demande = ce qu'un client cherche ;
-- Mise en relation = affaire via un partenaire ; Mandat = le contrat signé.
--
-- Décisions structurantes (CLAUDE.md) :
--  - PIPELINES CONFIGURABLES EN BASE : les étapes ne sont JAMAIS en dur dans le
--    code. Deux tables `pipelines` et `etapes_pipeline`. Ajouter/renommer une
--    étape = INSERT/UPDATE SQL, zéro développement.
--  - « Mandat en préparation » est une ÉTAPE d'opportunité, pas un état du bien.
--    Le statut du bien (prospecte/disponible/…) et l'étape d'opportunité vivent
--    en parallèle, ils ne se confondent pas.
--  - Liens bien / contact / demande TOUS optionnels : on peut suivre une affaire
--    avant d'avoir un bien en stock ou un client identifié.
--  - Montant en bigint FCFA (jamais float). Suppression logique sur l'opportunité.
--  - `agence_id` + RLS ; SELECT = agence_id seul (cf. 0016). Multi-agence.
--  - Un journal append-only `suivi_opportunites` donne la chronologie du suivi.
-- =============================================================================

-- --- Pipelines : un flux de vente/location propre à l'agence ------------------
create table if not exists public.pipelines (
  id         uuid primary key default gen_random_uuid(),
  agence_id  uuid not null references public.agences (id),
  nom        text not null,
  ordre      int  not null default 0,
  actif      boolean not null default true,  -- désactiver plutôt que supprimer
  cree_le    timestamptz not null default now()
);

create index if not exists pipelines_agence_idx on public.pipelines (agence_id);

-- --- Étapes d'un pipeline (colonnes du flux) ----------------------------------
-- `type` marque les étapes TERMINALES : 'gain' (affaire gagnée) / 'perte'
-- (affaire perdue). Les autres sont 'normale'. C'est ce qui pilote le statut de
-- l'opportunité côté services/, sans étape en dur dans le code.
create table if not exists public.etapes_pipeline (
  id           uuid primary key default gen_random_uuid(),
  agence_id    uuid not null references public.agences (id),
  pipeline_id  uuid not null references public.pipelines (id) on delete cascade,
  nom          text not null,
  ordre        int  not null default 0,
  type         text not null default 'normale'
               check (type in ('normale','gain','perte')),
  cree_le      timestamptz not null default now()
);

create index if not exists etapes_pipeline_pipeline_idx
  on public.etapes_pipeline (pipeline_id);

-- --- Opportunités -------------------------------------------------------------
create table if not exists public.opportunites (
  id              uuid primary key default gen_random_uuid(),
  agence_id       uuid not null references public.agences (id),
  reference       text not null,                       -- OP-AAAA-0001
  titre           text not null,
  pipeline_id     uuid not null references public.pipelines (id),
  etape_id        uuid not null references public.etapes_pipeline (id),
  -- Liens métier, tous optionnels.
  bien_id         uuid references public.biens (id),
  contact_id      uuid references public.contacts (id),
  demande_id      uuid references public.demandes (id),
  montant_estime  bigint,                              -- FCFA
  statut          text not null default 'ouverte'
                  check (statut in ('ouverte','gagnee','perdue')),
  motif_perte     text,                                -- rempli si perdue
  responsable_id  uuid references public.utilisateurs (id),
  date_cloture    timestamptz,                         -- date gain/perte
  cree_par        uuid references public.utilisateurs (id),
  cree_le         timestamptz not null default now(),
  maj_le          timestamptz not null default now(),
  supprime_le     timestamptz,
  unique (agence_id, reference)
);

create index if not exists opportunites_agence_idx   on public.opportunites (agence_id);
create index if not exists opportunites_etape_idx     on public.opportunites (etape_id);
create index if not exists opportunites_pipeline_idx  on public.opportunites (pipeline_id);

-- --- Journal de suivi (chronologie, append-only) ------------------------------
create table if not exists public.suivi_opportunites (
  id              uuid primary key default gen_random_uuid(),
  agence_id       uuid not null references public.agences (id),
  opportunite_id  uuid not null references public.opportunites (id) on delete cascade,
  type            text not null default 'note'
                  check (type in ('note','changement_etape','changement_statut',
                                  'appel','visite','offre')),
  description     text not null,
  etape_id        uuid references public.etapes_pipeline (id),  -- étape au moment de l'événement
  date_evenement  timestamptz not null default now(),
  cree_par        uuid references public.utilisateurs (id),
  cree_le         timestamptz not null default now()
);

create index if not exists suivi_opportunites_idx
  on public.suivi_opportunites (opportunite_id);

-- =============================================================================
-- Sécurité : GRANT + RLS (aucun droit par défaut ; sans GRANT, permission denied)
-- =============================================================================
grant select, insert, update on public.pipelines       to authenticated;
grant select, insert, update on public.etapes_pipeline to authenticated;
grant select, insert, update on public.opportunites    to authenticated;
-- Journal append-only : select + insert seulement.
grant select, insert on public.suivi_opportunites to authenticated;

grant all on public.pipelines          to service_role;
grant all on public.etapes_pipeline    to service_role;
grant all on public.opportunites       to service_role;
grant all on public.suivi_opportunites to service_role;

alter table public.pipelines          enable row level security;
alter table public.etapes_pipeline    enable row level security;
alter table public.opportunites        enable row level security;
alter table public.suivi_opportunites  enable row level security;

-- Pipelines
drop policy if exists "pipelines_select" on public.pipelines;
create policy "pipelines_select" on public.pipelines
  for select using (agence_id = public.agence_courante());
drop policy if exists "pipelines_insert" on public.pipelines;
create policy "pipelines_insert" on public.pipelines
  for insert with check (agence_id = public.agence_courante());
drop policy if exists "pipelines_update" on public.pipelines;
create policy "pipelines_update" on public.pipelines
  for update using (agence_id = public.agence_courante());

-- Étapes
drop policy if exists "etapes_pipeline_select" on public.etapes_pipeline;
create policy "etapes_pipeline_select" on public.etapes_pipeline
  for select using (agence_id = public.agence_courante());
drop policy if exists "etapes_pipeline_insert" on public.etapes_pipeline;
create policy "etapes_pipeline_insert" on public.etapes_pipeline
  for insert with check (agence_id = public.agence_courante());
drop policy if exists "etapes_pipeline_update" on public.etapes_pipeline;
create policy "etapes_pipeline_update" on public.etapes_pipeline
  for update using (agence_id = public.agence_courante());

-- Opportunités
drop policy if exists "opportunites_select" on public.opportunites;
create policy "opportunites_select" on public.opportunites
  for select using (agence_id = public.agence_courante());
drop policy if exists "opportunites_insert" on public.opportunites;
create policy "opportunites_insert" on public.opportunites
  for insert with check (agence_id = public.agence_courante());
drop policy if exists "opportunites_update" on public.opportunites;
create policy "opportunites_update" on public.opportunites
  for update using (agence_id = public.agence_courante());

-- Journal
drop policy if exists "suivi_opportunites_select" on public.suivi_opportunites;
create policy "suivi_opportunites_select" on public.suivi_opportunites
  for select using (agence_id = public.agence_courante());
drop policy if exists "suivi_opportunites_insert" on public.suivi_opportunites;
create policy "suivi_opportunites_insert" on public.suivi_opportunites
  for insert with check (agence_id = public.agence_courante());
