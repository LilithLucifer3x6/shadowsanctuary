-- The Veil (occasional-use makeup domain) was designed and implemented
-- with Double Cleanse removal mechanism, makeup_worn_today triggers,
-- and Lesser Rite exemption — all under the assumption that items can have
-- domain = 'Veil'. But the items.domain CHECK constraint in 001_core_schema.sql
-- only ever allowed ('Crown', 'Gaze', 'Grin', 'Visage', 'Vessel') — there was
-- never a way to actually create a Veil-domain item, via the UI or the database.
--
-- The original inline CHECK in 001 was auto-named 'items_domain_check' by
-- Postgres (confirmed against the live database). Drop it by that name and
-- recreate with 'Veil' added.
--
-- Idempotent: IF EXISTS means re-running is safe even if the constraint has
-- already been replaced (as is the case on the current live database).
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_domain_check;
ALTER TABLE items ADD CONSTRAINT items_domain_check
  CHECK (domain IN ('Crown', 'Gaze', 'Grin', 'Visage', 'Vessel', 'Veil'));
