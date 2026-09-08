-- =============================================================================
-- 0023 — Partenaires (agences confrères et courtiers)
-- Quand l'agence n'a pas le bien recherché en stock, elle sollicite un confrère
-- pour proposer un produit et toucher une commission d'apport. Le partenaire est
-- une CONTREPARTIE PROFESSIONNELLE, pas un client : il a une raison sociale, un
-- taux de commission habituel, un type. On ne le range donc pas dans `contacts`
-- (règle « un seul modèle contacts » qui vise les clients : prospect /
-- propriétaire / locataire / acquéreur), mais dans une table dédiée.
--
-- Décisions structurantes (CLAUDE.md) :
--  - `agence_id` + RLS sur toutes les tables métier.
--  - Suppression logique (`supprime_le`) : on désactive un partenaire, on ne le
--    DELETE pas (des mises en relation historiques y font référence).
--  - `taux_commission_defaut` est un TAUX (%), pas un montant : numeric, pas
--    bigint. Les montants en FCFA (les commissions réelles) vivent ailleurs (0024).
--  - SELECT = agence_id seul (cf. 0016) ; le masquage des supprimés est fait dans
--    les services via `.is("supprime_le", null)`.
-- =============================================================================

create table if not exists public.partenaires (
  id                     uuid primary key default gen_random_uuid(),
  agence_id              uuid not null references public.agences (id),
  nom                    text not null,
  type                   text not null default 'agence'
                         check (type in ('agence','courtier','demarcheur','autre')),
  telephone              text,
  email                  text,
  taux_commission_defaut numeric(5,2)
                         check (taux_commission_defaut is null
                                or (taux_commission_defaut >= 0 and taux_commission_defaut <= 100)),
  notes                  text,          -- zones couvertes, spécialités, en clair
  actif                  boolean not null default true,
  cree_par               uuid references public.utilisateurs (id),
  cree_le                timestamptz not null default now(),
  supprime_le            timestamptz
);

create index if not exists partenaires_agence_idx on public.partenaires (agence_id);

-- =============================================================================
-- Sécurité : GRANT + RLS (aucun droit par défaut ; sans GRANT, permission denied)
-- =============================================================================
grant select, insert, update on public.partenaires to authenticated;
grant all on public.partenaires to service_role;

alter table public.partenaires enable row level security;

drop policy if exists "partenaires_select" on public.partenaires;
create policy "partenaires_select" on public.partenaires
  for select using (agence_id = public.agence_courante());

drop policy if exists "partenaires_insert" on public.partenaires;
create policy "partenaires_insert" on public.partenaires
  for insert with check (agence_id = public.agence_courante());

drop policy if exists "partenaires_update" on public.partenaires;
create policy "partenaires_update" on public.partenaires
  for update using (agence_id = public.agence_courante());
