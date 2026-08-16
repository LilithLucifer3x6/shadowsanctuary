require('dotenv').config();
const { Client } = require('pg');

module.exports = async function teardown() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
  });

  try {
    await client.connect();
    // 1. Purge "TEST - DO NOT USE"
    await client.query(`DELETE FROM items WHERE name ILIKE '%TEST%' OR brand ILIKE '%TEST%';`);
    await client.query(`DELETE FROM journal_entries WHERE body_text ILIKE '%TEST%';`);
    // 2. Clear test profile
    await client.query(`UPDATE user_profile SET intake_answers = '{}'::jsonb WHERE id IN (SELECT id FROM auth.users WHERE email = 'test-automation@shadowsanctuary.local');`);
    console.log("Teardown complete: removed TEST artifacts from items, journals, and test-automation user_profile.");
  } catch (err) {
    console.error("Teardown Error:", err);
  } finally {
    await client.end();
  }
};
