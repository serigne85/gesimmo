-- =============================================================================
-- 0019 — Échéances de loyer
-- Une échéance = un mois de loyer dû sur un bail. Générées automatiquement à
-- l'activation du bail (services/echeances), jamais saisies à la main.
--
-- Décisions structurantes (CLAUDE.md) :
--  - `montant_du` en bigint FCFA, figé à la génération (snapshot du loyer+charges).
--  - `statut` (impaye|partiel|paye) SE RECALCULE à partir des paiements ; il ne
--    se saisit pas. « En retard » n'est pas stocké : c'est dérivé (impayé + date
--    passée), calculé à l'affichage.
--  - Pas de suppression logique ici : une échéance est générée, pas saisie ; on
--    peut la régénérer. Le soft-delete du projet vise baux/paiements, pas les
--    échéances.
-- =============================================================================

create table if not exists public.echeances_loyer (
  id             uuid primary key default gen_random_uuid(),
  agence_id      uuid not null references public.agences (id),
  bail_id        uuid not null references public.baux (id),
  periode        date not null,             -- 1er jour du mois concerné
  date_echeance  date not null,             -- jour où le loyer est dû
  montant_du     bigint not null,           -- FCFA (loyer + charges figés)
  statut         text not null default 'impaye'
                 check (statut in ('impaye','partiel','paye')),
  cree_le        timestamptz not null default now()
);

-- Une seule échéance par bail et par mois (rend la génération idempotente).
create unique index if not exists echeances_bail_periode_unique
  on public.echeances_loyer (bail_id, periode);

-- Accès fréquents : les échéances d'un bail ; le suivi par date d'échéance.
create index if not exists echeances_bail_idx on public.echeances_loyer (bail_id);
create index if not exists echeances_date_idx on public.echeances_loyer (date_echeance);

-- =============================================================================
-- Sécurité : GRANT + RLS (aucun droit par défaut ; sans GRANT, permission denied)
-- =============================================================================
grant select, insert, update, delete on public.echeances_loyer to authenticated;
grant all on public.echeances_loyer to service_role;

alter table public.echeances_loyer enable row level security;

drop policy if exists "echeances_select" on public.echeances_loyer;
create policy "echeances_select" on public.echeances_loyer
  for select using (agence_id = public.agence_courante());

drop policy if exists "echeances_insert" on public.echeances_loyer;
create policy "echeances_insert" on public.echeances_loyer
  for insert with check (agence_id = public.agence_courante());

drop policy if exists "echeances_update" on public.echeances_loyer;
create policy "echeances_update" on public.echeances_loyer
  for update using (agence_id = public.agence_courante());

drop policy if exists "echeances_delete" on public.echeances_loyer;
create policy "echeances_delete" on public.echeances_loyer
  for delete using (agence_id = public.agence_courante());
