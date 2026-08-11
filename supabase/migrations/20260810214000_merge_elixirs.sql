-- 1. Alter the domain check constraint
-- We must drop and recreate to add 'Herbal Elixirs' and remove 'Steeping'
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_domain_check;
ALTER TABLE items ADD CONSTRAINT items_domain_check
  CHECK (domain IN ('Crown', 'Gaze', 'Grin', 'Visage', 'Vessel', 'Veil', 'Herbal Elixirs', 'Measure'));

-- 2. Add legacy tea fields (discrete columns) to items
ALTER TABLE items ADD COLUMN IF NOT EXISTS elixir_caffeine TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS elixir_steep_time TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS elixir_circadian TEXT;

-- 3. Add vessel volume field for Spoon Registration
ALTER TABLE items ADD COLUMN IF NOT EXISTS vessel_volume_ml NUMERIC;

-- 4. Data Transfer: Safely merge shadowtome_elixirs into items
-- We populate the rootwork-shape columns (id, name, brand, ingredients, created_at)
-- and domain='Herbal Elixirs', category='Tea'.
INSERT INTO items (
  id,
  name,
  brand,
  ingredients,
  domain,
  category,
  created_at,
  elixir_caffeine,
  elixir_steep_time,
  elixir_circadian
)
SELECT 
  id,
  name,
  brand,
  ingredients,
  'Herbal Elixirs',
  'Tea',
  created_at,
  caffeine_content,
  steep_time,
  circadian_alignment
FROM shadowtome_elixirs;


