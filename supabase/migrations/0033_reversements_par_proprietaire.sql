-- =============================================================================
-- 0033 — Reversements par propriétaire (et non plus par bail)
-- Décision produit : l'agence reverse au propriétaire UN montant unique par mois,
-- couvrant l'ensemble de ses biens gérés. Le grain passe donc de
-- « un bail + un mois » (0022) à « un propriétaire + un mois ».
--
--  - `bail_id` devient facultatif : un reversement n'appartient plus à un bail
--    précis, mais au propriétaire.
--  - Les montants (loyer, commission, net reversé) sont désormais les TOTAUX du
--    mois pour le propriétaire (somme de ses biens loués).
--  - Un index unique (agence, propriétaire, mois) sur les lignes vivantes empêche
--    de reverser deux fois le même mois au même propriétaire.
--  - Migration des lignes existantes : on agrège les reversements par bail en un
--    reversement par propriétaire+mois, puis on neutralise (suppression logique)
--    les anciennes lignes. Sans données, ces étapes sont sans effet.
-- =============================================================================

-- 1. Le reversement n'est plus rattaché à un bail précis.
alter table public.reversements alter column bail_id drop not null;

-- 2a. Agréger les reversements existants (grain « par bail ») en reversements
--     « par propriétaire + mois ». Les nouvelles lignes ont bail_id = NULL.
insert into public.reversements
  (agence_id, bail_id, proprietaire_id, periode,
   montant_loyer, commission, montant_reverse,
   date_reversement, mode, cree_le)
select
  agence_id,
  null,
  proprietaire_id,
  periode,
  sum(montant_loyer),
  sum(commission),
  sum(montant_reverse),
  max(date_reversement),
  max(mode),
  now()
from public.reversements
where supprime_le is null
  and bail_id is not null
group by agence_id, proprietaire_id, periode;

-- 2b. Neutraliser les anciennes lignes par bail (elles ont servi à l'agrégat).
--     À faire AVANT l'index unique, sinon les doublons (agence, proprio, mois)
--     encore vivants feraient échouer sa création.
update public.reversements
set supprime_le = now()
where supprime_le is null
  and bail_id is not null;

-- 3. Un seul reversement vivant par propriétaire et par mois.
create unique index if not exists reversements_proprio_periode_uniq
  on public.reversements (agence_id, proprietaire_id, periode)
  where supprime_le is null;
