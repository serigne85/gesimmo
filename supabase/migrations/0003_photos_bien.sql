-- =============================================================================
-- 0003 — Photos des biens
-- Fichiers dans un bucket Storage privé, métadonnées dans public.photos_bien.
-- L'accès au bucket se fait uniquement côté serveur (service_role) : le
-- navigateur ne reçoit que des URLs signées temporaires. Pas de politique
-- storage.objects nécessaire ici.
-- =============================================================================

-- --- Bucket privé pour les photos de biens ----------------------------------
insert into storage.buckets (id, name, public)
select 'biens', 'biens', false
where not exists (select 1 from storage.buckets where id = 'biens');

-- --- Métadonnées des photos --------------------------------------------------
-- Une ligne référence un fichier du bucket 'biens' (colonne `chemin`).
create table if not exists public.photos_bien (
  id             uuid primary key default gen_random_uuid(),
  agence_id      uuid not null references public.agences (id),
  bien_id        uuid not null references public.biens (id),
  chemin         text not null unique,
  est_principale boolean not null default false,
  ordre          integer not null default 0,
  cree_le        timestamptz not null default now()
);

create index if not exists photos_bien_bien_idx
  on public.photos_bien (bien_id);

-- --- Sécurité : GRANT (rien n'est accordé par défaut) + RLS ------------------
grant select, insert, update, delete on public.photos_bien to authenticated;
grant all on public.photos_bien to service_role;

alter table public.photos_bien enable row level security;

drop policy if exists "photos_bien_select" on public.photos_bien;
create policy "photos_bien_select" on public.photos_bien
  for select using (agence_id = public.agence_courante());

drop policy if exists "photos_bien_insert" on public.photos_bien;
create policy "photos_bien_insert" on public.photos_bien
  for insert with check (agence_id = public.agence_courante());

drop policy if exists "photos_bien_update" on public.photos_bien;
create policy "photos_bien_update" on public.photos_bien
  for update using (agence_id = public.agence_courante());

drop policy if exists "photos_bien_delete" on public.photos_bien;
create policy "photos_bien_delete" on public.photos_bien
  for delete using (agence_id = public.agence_courante());
