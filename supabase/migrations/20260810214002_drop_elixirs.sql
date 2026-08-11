-- Cleanup: Drop the legacy table now that data is safely migrated
-- IMPORTANT: Run this ONLY after verifying SELECT COUNT(*) FROM items WHERE domain='Herbal Elixirs' 
-- matches the original shadowtome_elixirs row count.
DROP TABLE IF EXISTS shadowtome_elixirs;
