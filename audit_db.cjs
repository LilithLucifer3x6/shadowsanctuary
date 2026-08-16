require('dotenv').config();
const { Client } = require('pg');
(async () => {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  await client.connect();
  
  // Actually, I don't know the exact schema of user_profile. The prompt said: "user_profile (conditions, allergies, concerns)".
  // Let me just query user_profile.
  const resUsers = await client.query("SELECT * FROM user_profile");
  console.log('--- ALL USER PROFILES ---');
  resUsers.rows.forEach(r => {
     console.log('ID:', r.id, 'Email:', r.email);
     console.log('intake_answers:', JSON.stringify(r.intake_answers));
  });

  const resItems = await client.query("SELECT id, name, brand FROM items WHERE name ILIKE '%test%' OR brand ILIKE '%test%'");
  console.log('--- TEST ITEMS ---');
  console.table(resItems.rows);

  const resJournals = await client.query("SELECT id, body_text FROM journal_entries WHERE body_text ILIKE '%test%'");
  console.log('--- TEST JOURNALS ---');
  console.table(resJournals.rows);
  
  await client.end();
})();
