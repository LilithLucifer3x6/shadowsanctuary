DROP TABLE IF EXISTS public.infusion_batches;

CREATE TABLE IF NOT EXISTS public.alchemy_batches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  
  -- The Transmutation (Oil Infusion)
  oil_reading_raw numeric NOT NULL,
  oil_reading_unit text NOT NULL, -- 'mg/mL', 'mg/tsp', 'mg/Tbsp', 'mg/cup'
  canonical_mg_per_ml numeric NOT NULL, 
  
  -- Final Binding (Volumes)
  oil_volume_ml numeric NOT NULL,
  honey_volume_ml numeric NOT NULL,
  lecithin_volume_ml numeric NOT NULL,
  
  -- Totals
  calculated_total_mg numeric NOT NULL,
  calculated_final_mg_ml numeric NOT NULL,
  
  -- Lifecycle
  initial_volume_ml numeric NOT NULL,
  remaining_volume_ml numeric NOT NULL,
  lifecycle_state text DEFAULT 'stocked' NOT NULL,
  CONSTRAINT valid_lifecycle_state CHECK (lifecycle_state IN ('stocked', 'ebbing', 'hollow')),
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.alchemy_batches ENABLE ROW LEVEL SECURITY;

-- Apply standard user lockdown policy
CREATE POLICY "Enable ALL for authenticated users only" ON public.alchemy_batches
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
