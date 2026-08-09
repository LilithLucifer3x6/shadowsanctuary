-- Drop 4 tables confirmed to have zero references anywhere in the live
-- codebase (checked directly via grep across all of src/, both .jsx and .js).
-- No foreign keys from any other table point at these, so dropping is safe.
--
-- storage_locations — had seed data (002_seed_data.sql) but nothing ever
--   read it; presumably built for a "where is this item stored" feature
--   that was never wired up.
-- glyph_registry — presumably built for a dynamic icon-assignment system;
--   the app's actual icon system (custom-icons.jsx / lib/icons.jsx) is
--   static and never queries this table.
-- titration_log — presumably an earlier, separate attempt at dose-tracking
--   before isotretinoin_log (which IS actively used) was built instead.
-- prospective_items — "The Echo" pre-purchase analyzer feature is real and
--   live (src/lib/ai-engine.js), but it's a stateless AI query against
--   existing items/somatic_reactions data — it never persists anything to
--   this table.
--
-- Dropping a table automatically drops its RLS policies with it, so no
-- separate policy cleanup is needed.

DROP TABLE IF EXISTS storage_locations;
DROP TABLE IF EXISTS glyph_registry;
DROP TABLE IF EXISTS titration_log;
DROP TABLE IF EXISTS prospective_items;
