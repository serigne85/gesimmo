-- =============================================================================
-- 0006 — Lien vidéo du bien
-- `video_url` : URL d'une vidéo de présentation (YouTube, Drive, etc.), libre
-- et optionnelle. On stocke juste le lien ; la validation d'URL est faite côté
-- application (Zod). Pas de nouveau GRANT ni de RLS : droits au niveau TABLE (0002).
-- =============================================================================

alter table public.biens
  add column if not exists video_url text;
