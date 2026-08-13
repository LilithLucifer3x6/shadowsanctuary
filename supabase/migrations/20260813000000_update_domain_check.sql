ALTER TABLE items DROP CONSTRAINT IF EXISTS items_domain_check;
ALTER TABLE items ADD CONSTRAINT items_domain_check CHECK (domain IN ('Crown', 'Gaze', 'Grin', 'Visage', 'Form', 'Vessel', 'Measure'));
