-- =============================================================================
-- 0030 — Identité civile des contacts
-- Champs nécessaires aux contrats (mandats et baux) : date et lieu de naissance,
-- numéro de pièce d'identité (CNI). Tous OPTIONNELS : on ne les demande pas à la
-- saisie rapide d'un bien (5 champs), mais au moment de contractualiser.
-- Un seul modèle `contacts` (CLAUDE.md) : ces champs appartiennent à la personne,
-- qu'elle soit propriétaire, locataire ou les deux.
-- =============================================================================

alter table public.contacts
  add column if not exists date_naissance date,
  add column if not exists lieu_naissance text,
  add column if not exists cni text;

comment on column public.contacts.date_naissance is 'Date de naissance (pour les contrats).';
comment on column public.contacts.lieu_naissance is 'Lieu de naissance (pour les contrats).';
comment on column public.contacts.cni is 'Numéro de pièce d''identité / CNI (pour les contrats).';

-- Aucun GRANT ni policy à ajouter : contacts accorde déjà select/insert/update à
-- authenticated, et la RLS cloisonne par agence.
