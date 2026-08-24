-- =============================================================================
-- 0002 — Zones (référence), socle contacts, et biens
-- Première brique du portefeuille de biens.
-- =============================================================================

-- --- Fonction utilitaire : agence de l'utilisateur connecté --------------------
-- SECURITY DEFINER : s'exécute avec les droits du propriétaire, donc lit
-- `utilisateurs` sans repasser par la RLS -> pas de récursion. Toutes les
-- politiques RLS des tables métier s'appuieront dessus.
create or replace function public.agence_courante()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select agence_id
  from public.utilisateurs
  where id = auth.uid() and supprime_le is null
$$;

grant execute on function public.agence_courante() to authenticated;

-- --- Référence géographique : villes et zones --------------------------------
-- Vocabulaire contrôlé (jamais de texte libre) pour permettre filtres et KPI.
create table if not exists public.villes (
  id  uuid primary key default gen_random_uuid(),
  nom text not null unique
);

create table if not exists public.zones (
  id       uuid primary key default gen_random_uuid(),
  ville_id uuid not null references public.villes (id),
  nom      text not null,
  unique (ville_id, nom)
);

-- --- Contacts (socle minimal) -----------------------------------------------
-- Modèle unique de personne. Le téléphone est la clé naturelle, unique par
-- agence (les rôles prospect/propriétaire/locataire viendront plus tard).
create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  agence_id   uuid not null references public.agences (id),
  nom_complet text not null,
  telephone   text not null,
  cree_le     timestamptz not null default now(),
  supprime_le timestamptz
);

-- Unicité du téléphone par agence, uniquement sur les contacts non supprimés.
create unique index if not exists contacts_agence_tel_unique
  on public.contacts (agence_id, telephone)
  where supprime_le is null;

-- --- Biens ------------------------------------------------------------------
create table if not exists public.biens (
  id               uuid primary key default gen_random_uuid(),
  agence_id        uuid not null references public.agences (id),
  reference        text not null,
  type             text not null
                   check (type in ('appartement','maison','villa','terrain',
                                   'bureau','commerce','magasin','immeuble',
                                   'studio','chambre','autre')),
  objectif         text not null check (objectif in ('vente','location')),
  zone_id          uuid references public.zones (id),
  proprietaire_id  uuid not null references public.contacts (id),
  statut           text not null default 'prospecte'
                   check (statut in ('prospecte','sous_mandat','disponible',
                                     'sous_offre','vendu','loue','suspendu','archive')),
  statut_juridique text
                   check (statut_juridique in ('titre_foncier','bail',
                          'deliberation','acte_notarie','non_titre')),
  prix             bigint,           -- FCFA, jamais de décimales
  description      text,
  cree_le          timestamptz not null default now(),
  supprime_le      timestamptz
);

-- Référence unique par agence.
create unique index if not exists biens_agence_reference_unique
  on public.biens (agence_id, reference);

-- =============================================================================
-- Sécurité : GRANT + RLS
-- =============================================================================

-- Référence géo : lisible par tout utilisateur connecté.
grant select on public.villes, public.zones to authenticated;
grant all on public.villes, public.zones to service_role;

-- Tables métier : les agents lisent/créent/modifient dans leur agence.
grant select, insert, update on public.contacts, public.biens to authenticated;
grant all on public.contacts, public.biens to service_role;

alter table public.villes   enable row level security;
alter table public.zones    enable row level security;
alter table public.contacts enable row level security;
alter table public.biens    enable row level security;

-- Référence : lecture ouverte aux utilisateurs connectés.
drop policy if exists "villes_lecture" on public.villes;
create policy "villes_lecture" on public.villes for select using (true);
drop policy if exists "zones_lecture" on public.zones;
create policy "zones_lecture" on public.zones for select using (true);

-- Contacts : cloisonnés par agence.
drop policy if exists "contacts_select" on public.contacts;
create policy "contacts_select" on public.contacts
  for select using (agence_id = public.agence_courante() and supprime_le is null);
drop policy if exists "contacts_insert" on public.contacts;
create policy "contacts_insert" on public.contacts
  for insert with check (agence_id = public.agence_courante());
drop policy if exists "contacts_update" on public.contacts;
create policy "contacts_update" on public.contacts
  for update using (agence_id = public.agence_courante());

-- Biens : cloisonnés par agence.
drop policy if exists "biens_select" on public.biens;
create policy "biens_select" on public.biens
  for select using (agence_id = public.agence_courante() and supprime_le is null);
drop policy if exists "biens_insert" on public.biens;
create policy "biens_insert" on public.biens
  for insert with check (agence_id = public.agence_courante());
drop policy if exists "biens_update" on public.biens;
create policy "biens_update" on public.biens
  for update using (agence_id = public.agence_courante());

-- =============================================================================
-- Données de référence : Dakar et ses zones courantes
-- =============================================================================
insert into public.villes (nom)
select 'Dakar'
where not exists (select 1 from public.villes where nom = 'Dakar');

insert into public.zones (ville_id, nom)
select v.id, z.nom
from public.villes v
cross join (values
  ('Almadies'), ('Ngor'), ('Yoff'), ('Ouakam'), ('Mermoz'),
  ('Sacré-Cœur'), ('Point E'), ('Fann'), ('Plateau'), ('Médina'),
  ('Liberté'), ('Sicap'), ('Grand Dakar'), ('HLM'), ('Grand Yoff'),
  ('Parcelles Assainies'), ('Ouest Foire'), ('Pikine'), ('Guédiawaye'),
  ('Rufisque'), ('Keur Massar')
) as z(nom)
where v.nom = 'Dakar'
  and not exists (
    select 1 from public.zones zz where zz.ville_id = v.id and zz.nom = z.nom
  );
