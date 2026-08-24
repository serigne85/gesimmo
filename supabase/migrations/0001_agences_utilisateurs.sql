-- =============================================================================
-- 0001 — Agences et utilisateurs
-- Base minimale de l'authentification et du multi-agence (lot 1).
-- À exécuter dans l'éditeur SQL de Supabase.
-- =============================================================================

-- --- Agences ----------------------------------------------------------------
-- Multi-agence dès la V1 (CLAUDE.md), même s'il n'y en a qu'une pour l'instant.
create table if not exists public.agences (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  ville       text,
  cree_le     timestamptz not null default now(),
  supprime_le timestamptz
);

-- Une agence par défaut pour démarrer.
insert into public.agences (nom, ville)
select 'M2S IMMO', 'Dakar'
where not exists (select 1 from public.agences);

-- --- Utilisateurs -----------------------------------------------------------
-- Profil applicatif lié 1:1 au compte d'authentification Supabase (auth.users).
-- auth.users gère le mot de passe ; cette table porte le rôle et l'agence.
create table if not exists public.utilisateurs (
  id          uuid primary key references auth.users (id) on delete cascade,
  agence_id   uuid not null references public.agences (id),
  nom_complet text not null,
  email       text not null,
  role        text not null
              check (role in ('admin', 'direction', 'agent', 'gestionnaire', 'comptable')),
  actif       boolean not null default true,
  cree_le     timestamptz not null default now(),
  supprime_le timestamptz
);

-- --- Sécurité : GRANT + RLS -------------------------------------------------
-- Deux couches distinctes :
--   GRANT = le rôle a-t-il le droit d'utiliser la table (tout court) ?
--   RLS   = parmi les lignes, lesquelles peut-il voir ?
-- Sans GRANT, la RLS ne s'applique jamais : l'accès est refusé d'entrée.
-- On donne l'accès au rôle `authenticated` uniquement (jamais `anon`) : un
-- visiteur non connecté ne doit rien pouvoir lire.
grant select on public.agences to authenticated;
grant select on public.utilisateurs to authenticated;

-- Le rôle service_role (administration côté serveur) doit pouvoir tout faire.
-- Il contourne la RLS mais reste soumis aux GRANT de table : sans ceci, même
-- l'admin reçoit "permission denied". (Ce projet n'accorde pas les droits par
-- défaut sur les nouvelles tables, d'où ces GRANT explicites.)
grant all on public.agences to service_role;
grant all on public.utilisateurs to service_role;

alter table public.agences enable row level security;
alter table public.utilisateurs enable row level security;

-- Un utilisateur peut lire son propre profil (nécessaire pour connaître son rôle).
drop policy if exists "utilisateur_lit_son_profil" on public.utilisateurs;
create policy "utilisateur_lit_son_profil"
  on public.utilisateurs
  for select
  using (auth.uid() = id and supprime_le is null);

-- Un utilisateur peut lire son agence.
drop policy if exists "utilisateur_lit_son_agence" on public.agences;
create policy "utilisateur_lit_son_agence"
  on public.agences
  for select
  using (
    id in (select agence_id from public.utilisateurs where utilisateurs.id = auth.uid())
  );

-- =============================================================================
-- Créer le premier administrateur :
--   1. Dashboard Supabase > Authentication > Users > Add user
--      (renseigne email + mot de passe, coche "Auto Confirm User").
--   2. Copie l'UUID du user créé.
--   3. Exécute l'INSERT ci-dessous en remplaçant l'UUID et les infos :
--
-- insert into public.utilisateurs (id, agence_id, nom_complet, email, role)
-- values (
--   'COLLE-ICI-L-UUID-DU-USER',
--   (select id from public.agences limit 1),
--   'Nom Complet',
--   'email@exemple.sn',
--   'admin'
-- );
-- =============================================================================
