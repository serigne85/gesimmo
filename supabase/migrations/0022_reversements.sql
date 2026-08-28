-- =============================================================================
-- 0022 — Reversements aux propriétaires (gérance)
-- En gérance, l'agence encaisse le loyer, retient sa commission et reverse le
-- net au propriétaire. Un reversement = un bail + un mois.
--
-- Décisions structurantes (CLAUDE.md) :
--  - Montants en bigint FCFA (loyer encaissé, commission retenue, net reversé).
--  - Suppression logique (`supprime_le`) : c'est une écriture financière comme un
--    paiement ; on annule, on ne DELETE pas.
--  - `agence_id` + RLS ; SELECT = agence_id seul (cf. 0016).
-- =============================================================================

create table if not exists public.reversements (
  id              uuid primary key default gen_random_uuid(),
  agence_id       uuid not null references public.agences (id),
  bail_id         uuid not null references public.baux (id),
  proprietaire_id uuid not null references public.contacts (id),
  periode         date not null,            -- 1er jour du mois concerné
  montant_loyer   bigint not null,          -- encaissé ce mois (FCFA)
  commission      bigint not null default 0,-- retenue agence (FCFA)
  montant_reverse bigint not null,          -- net = loyer - commission
  date_reversement date not null,
  mode            text not null
                  check (mode in
                    ('especes','wave','orange_money','virement','cheque','depot_bancaire')),
  note            text,
  cree_par        uuid references public.utilisateurs (id),
  cree_le         timestamptz not null default now(),
  supprime_le     timestamptz
);

create index if not exists reversements_bail_idx on public.reversements (bail_id);

-- =============================================================================
-- Sécurité : GRANT + RLS (aucun droit par défaut ; sans GRANT, permission denied)
-- =============================================================================
grant select, insert, update on public.reversements to authenticated;
grant all on public.reversements to service_role;

alter table public.reversements enable row level security;

drop policy if exists "reversements_select" on public.reversements;
create policy "reversements_select" on public.reversements
  for select using (agence_id = public.agence_courante());

drop policy if exists "reversements_insert" on public.reversements;
create policy "reversements_insert" on public.reversements
  for insert with check (agence_id = public.agence_courante());

drop policy if exists "reversements_update" on public.reversements;
create policy "reversements_update" on public.reversements
  for update using (agence_id = public.agence_courante());
