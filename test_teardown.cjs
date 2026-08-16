require('dotenv').config();
const { Client } = require('pg');

module.exports = async function teardown() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  try {
    await client.connect();
    
    // Dynamically get all tables in the public schema
    const { rows: tables } = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`);
    
    for (const { table_name } of tables) {
      if (table_name === 'user_profile' || table_name === 'auth') continue;
      try { 
        await client.query(`DELETE FROM "${table_name}" WHERE "${table_name}"::text ILIKE '%TEST%'`); 
      } catch (err) {
        // Ignore constraints or cast errors
      }
    }

    // Explicitly handle user_profile for the test user
    try { 
      await client.query(`UPDATE user_profile SET intake_answers = '{}'::jsonb WHERE id IN (SELECT id FROM auth.users WHERE email = 'test-automation@shadowsanctuary.local')`); 
    } catch(e) {}
    
    console.log("Teardown complete: dynamically scanned all tables and removed TEST artifacts.");
  } catch (err) {
    console.error("Teardown Error:", err);
  } finally {
    await client.end();
  }
};
