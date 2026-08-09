-- The Veil (occasional-use makeup domain) was designed and implemented
-- with Double Cleanse removal mechanism, makeup_worn_today triggers,
-- and Lesser Rite exemption — all under the assumption that items can have
-- domain = 'Veil'. But the items.domain CHECK constraint has only ever
-- allowed ('Crown', 'Gaze', 'Grin', 'Visage', 'Vessel') — there has never
-- been a way to actually create a Veil-domain item, via the UI or
-- directly against the database. This adds it.
--
-- Uses a DO block rather than a hardcoded constraint name since the exact
-- auto-generated name wasn't confirmed against the live database.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'items'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%domain%IN%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE items DROP CONSTRAINT %I', constraint_name);
  END IF;

  ALTER TABLE items ADD CONSTRAINT items_domain_check
    CHECK (domain IN ('Crown', 'Gaze', 'Grin', 'Visage', 'Vessel', 'Veil'));
END $$;
