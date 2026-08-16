require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  await client.connect();

  // Find the test account ID
  const authRes = await client.query("SELECT id FROM auth.users WHERE email = 'test-automation@shadowsanctuary.local'");
  let testAccountId = null;
  if (authRes.rows.length > 0) {
     testAccountId = authRes.rows[0].id;
  }
  
  if (testAccountId) {
     console.log('Found test account:', testAccountId);
     // Purge user_profile for test account
     await client.query("UPDATE user_profile SET intake_answers = '{}'::jsonb, profile_data = '{}'::jsonb WHERE id = $1", [testAccountId]);
     console.log('Cleared test-automation user_profile data.');
  } else {
     console.log('No test-automation account found in auth.users.');
  }

  // Clear any stray items or journals
  const resItems = await client.query("DELETE FROM items WHERE name ILIKE '%test%' OR brand ILIKE '%test%' RETURNING id");
  console.log(`Deleted ${resItems.rowCount} test items.`);
  const resJournals = await client.query("DELETE FROM journal_entries WHERE body_text ILIKE '%test%' RETURNING id");
  console.log(`Deleted ${resJournals.rowCount} test journals.`);

  await client.end();
})();
