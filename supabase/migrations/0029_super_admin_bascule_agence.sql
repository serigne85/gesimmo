-- =============================================================================
-- 0029 — Super-admin plateforme + bascule d'agence
-- Permet à un compte « super-admin » (opérateur de la plateforme) de basculer
-- entre agences, chacune restant totalement cloisonnée. Un admin ordinaire, lui,
-- reste enfermé dans son agence : la bascule n'est JAMAIS honorée pour lui.
--
-- Le verrou vit dans la fonction agence_courante() (security definer), pas dans
-- l'application : masquer un bouton ne serait pas une sécurité (CLAUDE.md).
-- =============================================================================

-- --- 1. Drapeau super-admin sur le profil ------------------------------------
alter table public.utilisateurs
  add column if not exists super_admin boolean not null default false;

comment on column public.utilisateurs.super_admin is
  'Opérateur de la plateforme : peut basculer entre toutes les agences. À réserver aux comptes internes, jamais aux admins clients.';

-- --- 2. Agence active choisie par l'utilisateur ------------------------------
-- Une ligne par utilisateur : l'agence sur laquelle il « se trouve ». Absente
-- => on retombe sur son agence d'origine. Seuls les super-admins voient leur
-- choix honoré (cf. fonction ci-dessous).
create table if not exists public.agence_active (
  utilisateur_id uuid primary key references public.utilisateurs (id) on delete cascade,
  agence_id      uuid not null references public.agences (id),
  maj_le         timestamptz not null default now()
);

grant select, insert, update on public.agence_active to authenticated;
grant all on public.agence_active to service_role;

alter table public.agence_active enable row level security;

-- Chacun ne gère que sa propre ligne d'agence active.
drop policy if exists "agence_active_select" on public.agence_active;
create policy "agence_active_select" on public.agence_active
  for select using (utilisateur_id = auth.uid());
drop policy if exists "agence_active_insert" on public.agence_active;
create policy "agence_active_insert" on public.agence_active
  for insert with check (utilisateur_id = auth.uid());
drop policy if exists "agence_active_update" on public.agence_active;
create policy "agence_active_update" on public.agence_active
  for update using (utilisateur_id = auth.uid());

-- --- 3. Réécriture de agence_courante() --------------------------------------
-- Renvoie l'agence active SI l'utilisateur est super-admin (donc autorisé à
-- basculer), sinon son agence d'origine. La condition super_admin = true rend
-- toute tentative de bascule d'un compte ordinaire sans effet : il reste chez
-- lui. C'est le point de sécurité central du multi-agence.
create or replace function public.agence_courante()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select aa.agence_id
      from public.agence_active aa
      join public.utilisateurs u on u.id = aa.utilisateur_id
      where aa.utilisateur_id = auth.uid()
        and u.super_admin = true
        and u.supprime_le is null
    ),
    (
      select agence_id
      from public.utilisateurs
      where id = auth.uid() and supprime_le is null
    )
  );
$$;

grant execute on function public.agence_courante() to authenticated;

-- --- 4. Lecture des agences : le super-admin les voit toutes -----------------
-- Nécessaire pour peupler le sélecteur d'agence. Un utilisateur ordinaire ne
-- voit toujours que son agence.
drop policy if exists "utilisateur_lit_son_agence" on public.agences;
create policy "utilisateur_lit_son_agence"
  on public.agences
  for select
  using (
    id in (select agence_id from public.utilisateurs where utilisateurs.id = auth.uid())
    or exists (
      select 1 from public.utilisateurs u
      where u.id = auth.uid() and u.super_admin = true and u.supprime_le is null
    )
  );

-- =============================================================================
-- Après application : marquer TON compte comme super-admin (une seule fois).
-- Voir supabase/seeds/super-admin.sql (UPDATE par email).
-- =============================================================================
