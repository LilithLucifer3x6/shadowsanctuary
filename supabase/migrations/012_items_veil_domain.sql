-- The Veil (occasional-use makeup domain) was designed and implemented
-- with Double Cleanse removal mechanism, makeup_worn_today triggers,
-- and Lesser Rite exemption — all under the assumption that items can have
-- domain = 'Veil'. But the items.domain CHECK constraint has only ever
-- allowed ('Crown', 'Gaze', 'Grin', 'Visage', 'Vessel') — there has never
-- been a way to actually create a Veil-domain item, via the UI or
-- directly against the database. This adds it.
--
-- NOTE: this migration was already applied manually against the live
-- database. The dynamic constraint-lookup previously used here didn't
-- actually match Postgres's normalized internal representation of the
-- CHECK clause, so it silently no-op'd instead of finding and dropping
-- the old constraint — that was worked around at the time by running the
-- two statements below directly. Rewritten here to be safely re-runnable:
-- DROP ... IF EXISTS with the real, now twice-confirmed constraint name,
-- no dynamic lookup needed.
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_domain_check;
ALTER TABLE items ADD CONSTRAINT items_domain_check
  CHECK (domain IN ('Crown', 'Gaze', 'Grin', 'Visage', 'Vessel', 'Veil'));
