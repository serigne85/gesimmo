-- =============================================================================
-- 0009 — Modèles de contrat de mandat (éditables par l'agence)
-- Un modèle par nature de mandat (vente / location / gérance), propre à chaque
-- agence. Le corps contient le texte des articles avec des variables {{cle}}
-- (ex. {{mandant_nom}}, {{commission}}) remplacées à la génération du PDF.
-- Édition réservée à admin/direction : le contrôle se fait dans l'action
-- serveur (la RLS, elle, cloisonne seulement par agence).
-- =============================================================================

create table if not exists public.modeles_mandats (
  id         uuid primary key default gen_random_uuid(),
  agence_id  uuid not null references public.agences (id),
  type       text not null check (type in ('vente','location','gerance')),
  titre      text not null,
  corps      text not null default '',
  maj_le     timestamptz not null default now(),
  cree_le    timestamptz not null default now(),
  unique (agence_id, type)
);

-- =============================================================================
-- Sécurité : GRANT + RLS
-- Rappel projet : aucun droit de table par défaut → GRANT explicites.
-- =============================================================================
grant select, insert, update on public.modeles_mandats to authenticated;
grant all on public.modeles_mandats to service_role;

alter table public.modeles_mandats enable row level security;

drop policy if exists "modeles_mandats_select" on public.modeles_mandats;
create policy "modeles_mandats_select" on public.modeles_mandats
  for select using (agence_id = public.agence_courante());
drop policy if exists "modeles_mandats_insert" on public.modeles_mandats;
create policy "modeles_mandats_insert" on public.modeles_mandats
  for insert with check (agence_id = public.agence_courante());
drop policy if exists "modeles_mandats_update" on public.modeles_mandats;
create policy "modeles_mandats_update" on public.modeles_mandats
  for update using (agence_id = public.agence_courante());
