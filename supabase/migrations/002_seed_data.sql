-- Seed Data for The Apothecary Lounge

INSERT INTO codex_entries (ingredient, reason, is_permanent, source)
VALUES ('lavender', 'Known sensitivity — permanent entry', true, 'system');

INSERT INTO appointments (name, cadence_weeks, glyph, is_optional)
VALUES
  ('The Root Weaving', 8, 'locs', false),
  ('The Gilded Hand', 2, 'talon', false),
  ('The Soaking', 2, 'bathtub', false),
  ('The Smoothing', NULL, 'depilatory', true),
  ('The Paring', NULL, 'razor', true);

INSERT INTO conflict_rules (ingredient_a, ingredient_b, conflict_type, description, source)
VALUES
  ('retinoid', 'acid', 'separate_days', 'May cause excess irritation and compromise the skin barrier.', 'reference'),
  ('retinoid', 'vitamin_c', 'separate_am_pm', 'Differing optimal pH ranges and increased irritation risk.', 'reference'),
  ('retinoid', 'benzoyl_peroxide', 'separate_days', 'Benzoyl peroxide can degrade certain retinoids and increase dryness.', 'reference'),
  ('acid', 'acid', 'advisory', 'Layering AHA and BHA can lead to over-exfoliation. Proceed with caution.', 'reference'),
  ('vitamin_c', 'niacinamide', 'advisory', 'Historical concern of flushing; mostly outdated but worth noting for sensitive skin.', 'reference');


