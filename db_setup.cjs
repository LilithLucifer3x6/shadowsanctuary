require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
  });

  try {
    await client.connect();

    console.log("Connected to DB.");

    // 1. Purge "TEST - DO NOT USE"
    const resInventory = await client.query(`DELETE FROM inventory WHERE name = 'TEST - DO NOT USE' OR brand = 'TEST - DO NOT USE' RETURNING *;`);
    console.log(`Deleted from inventory: ${resInventory.rowCount}`);

    try {
        const resJournal = await client.query(`DELETE FROM journal_entries WHERE body_text LIKE '%TEST - DO NOT USE%' RETURNING *;`);
        console.log(`Deleted from journal_entries: ${resJournal.rowCount}`);
    } catch(e) {}

    // 2. Delete rogue test accounts from Auth
    const resAuth = await client.query(`
      DELETE FROM auth.users 
      WHERE email IN ('playwright_tester_99@gmail.com') OR email LIKE 'test_1786%@gmail.com'
      RETURNING email;
    `);
    console.log("Deleted auth users:", resAuth.rows.map(r => r.email));

    // 3. Create testament_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.testament_log (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid REFERENCES auth.users NOT NULL,
        image_url text NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
        notes text
      );
    `);
    console.log("Created public.testament_log table.");

    // Ensure RLS and Policy
    await client.query(`ALTER TABLE public.testament_log ENABLE ROW LEVEL SECURITY;`);
    
    // Check if policy exists before creating
    const polRes = await client.query(`
      SELECT policyname FROM pg_policies WHERE tablename = 'testament_log' AND policyname = 'Users can manage their own testament logs';
    `);
    if (polRes.rowCount === 0) {
      await client.query(`
        CREATE POLICY "Users can manage their own testament logs" ON public.testament_log FOR ALL USING (auth.uid() = user_id);
      `);
      console.log("Created RLS policy for testament_log.");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
