-- The original settings default used font_size/typeface (snake_case), but the
-- actual React code reads and writes fontSize/fontFamily (camelCase) — a real
-- key-name mismatch. Any profile created with the original default, and never
-- explicitly re-saved through the Settings panel, would silently receive
-- `undefined` for both values on load, causing applySettings() to set the
-- --ff CSS variable to the literal string "undefined" rather than a real font.
-- (applySettings() itself now also has defensive fallbacks as of this same
-- change, but the schema default should match reality regardless.)
ALTER TABLE user_profile
  ALTER COLUMN settings SET DEFAULT '{"fontSize": "18", "fontFamily": "Elsie", "tts": false, "health": false, "cal": false, "gcalClientId": ""}'::jsonb;

-- Repair any existing row still holding the old stale snake_case shape.
-- This is a targeted merge, not a replacement — it only touches fontSize and
-- fontFamily, and removes the two dead snake_case keys. Anything else already
-- saved (tts, health, cal, gcalClientId, or any other future key) is left
-- completely untouched.
UPDATE user_profile
SET settings = (settings - 'font_size' - 'typeface') || jsonb_build_object(
  'fontSize', COALESCE(settings->>'fontSize', NULLIF(settings->>'font_size', ''), '18'),
  'fontFamily', COALESCE(
    settings->>'fontFamily',
    NULLIF(NULLIF(settings->>'typeface', 'default'), ''),
    'Elsie'
  )
)
WHERE settings ? 'font_size' OR settings ? 'typeface' OR NOT (settings ? 'fontFamily');
