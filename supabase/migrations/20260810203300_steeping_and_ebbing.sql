-- Phase 5: Steeping Domain and Fields, plus Predictive Ebbing RPC

-- 1. Add Steeping domain to the constraint
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_domain_check;
ALTER TABLE items ADD CONSTRAINT items_domain_check
  CHECK (domain IN ('Crown', 'Gaze', 'Grin', 'Visage', 'Vessel', 'Veil', 'Steeping'));

-- 2. Add LEVO and potency fields
-- LEVO parameters
ALTER TABLE items ADD COLUMN IF NOT EXISTS levo_material_qty NUMERIC; -- Unit: grams
ALTER TABLE items ADD COLUMN IF NOT EXISTS levo_temperature NUMERIC;  -- Unit: Fahrenheit
ALTER TABLE items ADD COLUMN IF NOT EXISTS levo_duration NUMERIC;     -- Unit: minutes
ALTER TABLE items ADD COLUMN IF NOT EXISTS levo_carrier_oil TEXT;     -- Categorical text (MCT, coconut, olive)

-- Potency fields
ALTER TABLE items ADD COLUMN IF NOT EXISTS measured_potency_mg_ml NUMERIC;
ALTER TABLE items ADD COLUMN IF NOT EXISTS inferred_potency_mg_ml NUMERIC;
ALTER TABLE items ADD COLUMN IF NOT EXISTS potency_source TEXT CHECK (potency_source IN ('measured', 'inferred'));

-- 3. Predictive Ebbing RPC
-- Returns the list of item IDs that are currently "ebbing"
CREATE OR REPLACE FUNCTION get_ebbing_items()
RETURNS TABLE(item_id UUID) AS $$
BEGIN
    RETURN QUERY
    WITH item_stats AS (
        SELECT 
            i.id,
            i.is_opened,
            i.opened_date,
            COUNT(rh.id) as use_count,
            MAX(rh.completed_at) as last_use_date,
            MIN(rh.completed_at) as first_use_date
        FROM items i
        LEFT JOIN routine_history rh ON rh.item_id = i.id
        WHERE i.lifecycle_state = 'stocked'
        GROUP BY i.id, i.is_opened, i.opened_date
    )
    SELECT id
    FROM item_stats
    WHERE 
        -- If >= 3 uses, compare days since last use with the historical average (minimum 1 day)
        (use_count >= 3 AND 
         (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_use_date)) / 86400) > 
         GREATEST((EXTRACT(EPOCH FROM (last_use_date - first_use_date)) / 86400 / (use_count - 1)), 1.0)
        )
        OR
        -- If < 3 uses but used at least once, compare days since last use with 14
        (use_count > 0 AND use_count < 3 AND 
         (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_use_date)) / 86400) > 14
        )
        OR
        -- If never used but opened, compare days since opened with 14
        (use_count = 0 AND is_opened = true AND opened_date IS NOT NULL AND
         (CURRENT_DATE - opened_date) > 14
        );
END;
$$ LANGUAGE plpgsql STABLE;
