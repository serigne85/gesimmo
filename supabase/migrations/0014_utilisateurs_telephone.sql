-- =============================================================================
-- 0014 — Téléphone des utilisateurs
-- Ajoute le numéro de téléphone au profil applicatif (table `utilisateurs`).
-- À exécuter dans l'éditeur SQL de Supabase.
-- =============================================================================

-- Colonne NULLABLE : les comptes déjà créés (dont le premier admin) n'ont pas
-- de téléphone. L'obligation de saisie est portée par la validation Zod à la
-- CRÉATION d'un nouveau compte, pas par une contrainte NOT NULL qui casserait
-- l'existant. (On pourra durcir en NOT NULL plus tard, une fois l'existant
-- complété.)
alter table public.utilisateurs
  add column if not exists telephone text;

comment on column public.utilisateurs.telephone is
  'Téléphone du collaborateur. Requis à la création (validation applicative), nullable pour les comptes antérieurs à cette colonne.';
