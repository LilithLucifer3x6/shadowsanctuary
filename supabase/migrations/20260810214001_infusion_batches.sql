CREATE TABLE IF NOT EXISTS public.infusion_batches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  final_honey_item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  
  -- Raw Flower Phase
  raw_flower_item_id uuid REFERENCES public.items(id) ON DELETE SET NULL,
  flower_weight_g numeric,
  flower_tcheck_1 numeric,
  
  -- Decarboxylation Phase
  decarb_temp_f numeric,
  decarb_duration_m numeric,
  flower_tcheck_2 numeric,
  
  -- Oil Infusion Phase
  carrier_oil_item_id uuid REFERENCES public.items(id) ON DELETE SET NULL,
  infusion_temp_f numeric,
  infusion_duration_m numeric,
  oil_tcheck_anchor numeric NOT NULL, -- The critical anchor reading
  dilution_factor numeric, -- Usually for readings > 15mg/mL
  
  -- Final Blending Phase
  oil_volume_ml numeric,
  honey_volume_ml numeric,
  lecithin_volume_ml numeric,
  
  -- The Calculated Result
  calculated_final_mg_ml numeric,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.infusion_batches ENABLE ROW LEVEL SECURITY;

-- Apply standard user lockdown policy
CREATE POLICY "Enable ALL for authenticated users only" ON public.infusion_batches
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
