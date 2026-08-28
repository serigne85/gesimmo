-- =============================================================================
-- 0020 — Paiements de loyer (+ cache montant_regle sur les échéances)
-- Un paiement encaisse tout ou partie d'une échéance. Plusieurs paiements
-- peuvent se rattacher à la même échéance (paiements partiels, CLAUDE.md).
--
-- Décisions structurantes (CLAUDE.md) :
--  - `montant` en bigint FCFA, strictement positif.
--  - Modes : espèces, Wave, Orange Money, virement, chèque, dépôt bancaire.
--  - Suppression logique (`supprime_le`) : un reçu erroné s'annule, jamais de
--    DELETE physique.
--  - Le statut de l'échéance NE se saisit pas : il se recalcule dans services/
--    (echeances/paiements) à partir des paiements non supprimés. On matérialise
--    le total réglé dans `echeances_loyer.montant_regle` (cache mis à jour dans
--    le même recalcul) pour éviter de re-sommer à chaque lecture de liste.
-- =============================================================================

create table if not exists public.paiements (
  id             uuid primary key default gen_random_uuid(),
  agence_id      uuid not null references public.agences (id),
  echeance_id    uuid not null references public.echeances_loyer (id),
  bail_id        uuid not null references public.baux (id),
  montant        bigint not null check (montant > 0),
  date_paiement  date not null,
  mode           text not null
                 check (mode in
                   ('especes','wave','orange_money','virement','cheque','depot_bancaire')),
  reference_transaction text,
  note           text,
  encaisse_par   uuid references public.utilisateurs (id),
  cree_le        timestamptz not null default now(),
  supprime_le    timestamptz
);

create index if not exists paiements_echeance_idx on public.paiements (echeance_id);
create index if not exists paiements_bail_idx on public.paiements (bail_id);

-- Cache du total réglé d'une échéance (recalculé côté service à chaque paiement).
alter table public.echeances_loyer
  add column if not exists montant_regle bigint not null default 0;

-- =============================================================================
-- Sécurité : GRANT + RLS (aucun droit par défaut ; sans GRANT, permission denied)
-- update autorisé pour la suppression logique.
-- =============================================================================
grant select, insert, update on public.paiements to authenticated;
grant all on public.paiements to service_role;

alter table public.paiements enable row level security;

-- SELECT = agence_id SEUL (pas de `supprime_le is null` : casserait le
-- soft-delete, cf. migration 0016).
drop policy if exists "paiements_select" on public.paiements;
create policy "paiements_select" on public.paiements
  for select using (agence_id = public.agence_courante());

drop policy if exists "paiements_insert" on public.paiements;
create policy "paiements_insert" on public.paiements
  for insert with check (agence_id = public.agence_courante());

drop policy if exists "paiements_update" on public.paiements;
create policy "paiements_update" on public.paiements
  for update using (agence_id = public.agence_courante());
