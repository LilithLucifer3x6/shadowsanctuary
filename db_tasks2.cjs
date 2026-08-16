const { Client } = require('pg');
const connectionString = "postgresql://postgres.gwezojwujynharoqjuio:NEMQqKLue247Yb3p@aws-1-us-west-2.pooler.supabase.com:5432/postgres";
const client = new Client({ connectionString });

async function run() {
  await client.connect();
  
  console.log("Creating wash_day_log table...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.wash_day_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      entry_date DATE,
      moon_phase TEXT,
      notes TEXT,
      likenesses TEXT[]
    );
  `);
  
  await client.query(`
    ALTER TABLE public.wash_day_log ENABLE ROW LEVEL SECURITY;
  `);
  
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wash_day_log' AND policyname = 'Users can manage their own wash day logs') THEN
        CREATE POLICY "Users can manage their own wash day logs" ON public.wash_day_log
          FOR ALL USING (auth.uid() = user_id);
      END IF;
    END
    $$;
  `);
  
  console.log("wash_day_log table created and secured.");
  
  await client.end();
}

run().catch(err => { console.error(err); process.exit(1); });
