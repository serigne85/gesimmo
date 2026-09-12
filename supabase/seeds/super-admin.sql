-- =============================================================================
-- Seed — Désigner le super-admin de la plateforme
-- À exécuter UNE fois dans l'éditeur SQL de Supabase, après la migration 0029.
-- Remplace l'email par celui de TON compte (celui qui gère Dakar aujourd'hui).
-- =============================================================================

update public.utilisateurs
set super_admin = true
where email = 'ton-email-admin@exemple.sn'
  and supprime_le is null;

-- Vérification : doit renvoyer ta ligne avec super_admin = true.
-- select nom_complet, email, role, super_admin from public.utilisateurs
--   where super_admin = true;
