-- =============================================================================
-- 0017 — Prospections terrain (carnet de démarchage)
-- Matière brute collectée par les agents sur le terrain, AVANT qu'une piste
-- n'entre dans le portefeuille. Volontairement distincte de `biens` : beaucoup
-- de pistes ne se concrétisent pas (indisponible), on ne pollue donc pas le
-- portefeuille. Une prospection ne crée NI contact NI bien : ce n'est qu'à la
-- conversion (« Ajouter aux biens », possible seulement si statut = disponible)
-- qu'on crée le contact (dédup par téléphone) et le bien pré-rempli. Le modèle
-- unique `contacts` reste donc respecté.
--
-- IMPORTANT (leçon migration 0016) : la policy SELECT ne porte PAS
-- `supprime_le IS NULL`. Sinon la suppression logique (UPDATE supprime_le)
-- redeviendrait impossible (42501). Le masquage des lignes supprimées se fait
-- au niveau requête (`.is("supprime_le", null)`), comme pour biens/demandes.
-- =============================================================================

create table if not exists public.prospections (
  id               uuid primary key default gen_random_uuid(),
  agence_id        uuid not null references public.agences (id),
  date_prospection date not null default current_date,
  nom_complet      text not null,                 -- propriétaire pressenti (texte brut)
  telephone        text not null,
  contact_nom      text,                          -- « personne à contacter » / relais
  contact_tel      text,
  zone_id          uuid references public.zones (id),
  produit          text,                          -- ex. « villa à vendre » ; mappé à la conversion
  statut           text not null default 'disponible'
                   check (statut in ('indisponible','disponible','a_relancer')),
  date_relance     date,                          -- pertinent si statut = 'a_relancer'
  observation      text,
  agent_id         uuid references public.utilisateurs (id),  -- responsable du suivi
  bien_id          uuid references public.biens (id),          -- rempli à la conversion
  converti_le      timestamptz,
  cree_par         uuid references public.utilisateurs (id),
  cree_le          timestamptz not null default now(),
  supprime_le      timestamptz
);

-- Filtrage courant : par statut, par agent, et relances dues (date_relance).
create index if not exists prospections_agence_statut_idx
  on public.prospections (agence_id, statut);
create index if not exists prospections_agence_relance_idx
  on public.prospections (agence_id, date_relance)
  where statut = 'a_relancer' and supprime_le is null;
-- Détection de doublon à la saisie (téléphone), sans contrainte dure : le terrain
-- peut légitimement recroiser un même numéro.
create index if not exists prospections_agence_tel_idx
  on public.prospections (agence_id, telephone);

-- =============================================================================
-- Sécurité : GRANT + RLS
-- Rappel projet : aucun droit de table par défaut → GRANT explicites.
-- Suppression = logique (UPDATE supprime_le), donc pas de droit DELETE.
-- =============================================================================
grant select, insert, update on public.prospections to authenticated;
grant all on public.prospections to service_role;

alter table public.prospections enable row level security;

-- Cloisonnement par agence. SELECT sans filtre supprime_le (cf. 0016).
drop policy if exists "prospections_select" on public.prospections;
create policy "prospections_select" on public.prospections
  for select using (agence_id = public.agence_courante());

drop policy if exists "prospections_insert" on public.prospections;
create policy "prospections_insert" on public.prospections
  for insert with check (agence_id = public.agence_courante());

drop policy if exists "prospections_update" on public.prospections;
create policy "prospections_update" on public.prospections
  for update
  using (agence_id = public.agence_courante())
  with check (agence_id = public.agence_courante());
