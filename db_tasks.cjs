const { Client } = require('pg');
const connectionString = "postgresql://postgres.gwezojwujynharoqjuio:NEMQqKLue247Yb3p@aws-1-us-west-2.pooler.supabase.com:5432/postgres";
const client = new Client({ connectionString });

async function run() {
  await client.connect();
  
  console.log("Purging TEST - DO NOT USE...");
  const res1 = await client.query(`DELETE FROM public.items WHERE name = 'TEST - DO NOT USE'`);
  console.log(`Deleted ${res1.rowCount} items named TEST - DO NOT USE`);
  
  console.log("Fetching users...");
  const usersRes = await client.query(`SELECT id, email FROM auth.users`);
  for (const user of usersRes.rows) {
    if (user.email === 'playwright_tester_99@gmail.com' || user.email.startsWith('test_1786')) {
       console.log(`Deleting user: ${user.email}`);
       await client.query(`DELETE FROM auth.users WHERE id = $1`, [user.id]);
    }
  }
  
  console.log("Creating testament_log table...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.testament_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      image_url TEXT NOT NULL,
      notes TEXT
    );
  `);
  
  await client.query(`
    ALTER TABLE public.testament_log ENABLE ROW LEVEL SECURITY;
  `);
  
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'testament_log' AND policyname = 'Users can manage their own testament logs') THEN
        CREATE POLICY "Users can manage their own testament logs" ON public.testament_log
          FOR ALL USING (auth.uid() = user_id);
      END IF;
    END
    $$;
  `);
  
  console.log("testament_log table created and secured.");
  
  await client.end();
}

run().catch(err => { console.error(err); process.exit(1); });
