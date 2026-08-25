-- =============================================================================
-- 0005 — Titre du bien et contact secondaire
-- `titre`      : intitulé libre du bien (optionnel), en tête de la fiche.
-- `contact_id` : personne à joindre pour le bien, distincte du propriétaire
--                (gardien, mandataire, personne qui fait visiter). Optionnel.
--                2e clé étrangère vers `contacts` : les jointures devront lever
--                l'ambiguïté (hint PostgREST `contacts!contact_id`).
-- Pas de nouveau GRANT ni de RLS : droits accordés au niveau de la TABLE (0002).
-- =============================================================================

alter table public.biens
  add column if not exists titre      text,
  add column if not exists contact_id uuid references public.contacts (id);
