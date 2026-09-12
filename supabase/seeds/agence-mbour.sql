-- =============================================================================
-- Seed — Agence M2S IMMO Mbour (nouveau tenant)
-- Provisionne une seconde agence, ses zones, et son premier administrateur.
--
-- À exécuter dans l'éditeur SQL de Supabase (il tourne en superuser : il
-- contourne la RLS, l'INSERT dans `utilisateurs` passe donc sans souci).
-- Ce fichier vit dans supabase/seeds/ (PAS dans migrations/) : il n'est jamais
-- rejoué par `npx supabase db push`. C'est de la donnée tenant, pas du schéma.
--
-- Rappel multi-tenant : chaque agence est isolée par la RLS (agence_id =
-- agence_courante()). Créer l'agence + un admin suffit à cloisonner ses données.
-- =============================================================================

-- --- 1. L'agence -------------------------------------------------------------
-- Idempotent : on ne crée Mbour que si elle n'existe pas déjà.
insert into public.agences (nom, ville)
select 'M2S IMMO Mbour', 'Mbour'
where not exists (
  select 1 from public.agences where nom = 'M2S IMMO Mbour' and supprime_le is null
);

-- --- 2. La ville et les zones de Mbour ---------------------------------------
-- La référence géo (villes/zones) est PARTAGÉE entre agences (pas de agence_id).
-- Ces zones apparaîtront donc aussi dans les listes de Dakar : c'est bénin, et
-- ce sera cloisonné par agence en Phase 1 (console opérateur).
insert into public.villes (nom)
values ('Mbour')
on conflict (nom) do nothing;

insert into public.zones (ville_id, nom)
select v.id, z.nom
from public.villes v
cross join (values
  ('Mbour Centre'), ('Grand Mbour'), ('Tefess'), ('Mballing'),
  ('Saly Portudal'), ('Saly Niakh Niakhal'), ('Somone'), ('Ngaparou'),
  ('Nianing'), ('Warang'), ('Pointe Sarène'), ('Golf')
) as z(nom)
where v.nom = 'Mbour'
on conflict (ville_id, nom) do nothing;

-- --- 3. Le premier administrateur de Mbour -----------------------------------
-- PRÉALABLE (à faire AVANT ce bloc, dans le Dashboard Supabase) :
--   Authentication > Users > Add user
--     - email + mot de passe de l'admin Mbour
--     - cocher « Auto Confirm User »
--   Puis copier l'UUID du user créé et le coller ci-dessous.
--
-- Un utilisateur appartient à UNE seule agence : crée un compte NEUF pour Mbour,
-- ne réutilise pas un compte de Dakar. L'email doit être le même qu'au Dashboard.
--
-- Décommente et complète :
--
-- insert into public.utilisateurs (id, agence_id, nom_complet, email, telephone, role)
-- values (
--   'COLLE-ICI-L-UUID-DU-USER',
--   (select id from public.agences where nom = 'M2S IMMO Mbour' and supprime_le is null),
--   'Nom Complet Admin Mbour',
--   'admin.mbour@exemple.sn',
--   '77XXXXXXX',
--   'admin'
-- );

-- --- 4. Vérifications ---------------------------------------------------------
-- select id, nom, ville from public.agences where supprime_le is null;
-- select z.nom from public.zones z join public.villes v on v.id = z.ville_id
--   where v.nom = 'Mbour' order by z.nom;
-- select nom_complet, email, role from public.utilisateurs
--   where agence_id = (select id from public.agences where nom = 'M2S IMMO Mbour');
