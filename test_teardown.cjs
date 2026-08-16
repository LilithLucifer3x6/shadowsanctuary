require('dotenv').config();
const { Client } = require('pg');

module.exports = async function teardown() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
  });

  try {
    await client.connect();
    // 1. Purge "TEST - DO NOT USE"
    await client.query(`DELETE FROM inventory WHERE name = 'TEST - DO NOT USE' OR brand = 'TEST - DO NOT USE';`);
    await client.query(`DELETE FROM journal_entries WHERE body_text LIKE '%TEST - DO NOT USE%';`);
    console.log("Teardown complete: removed TEST artifacts.");
  } catch (err) {
    console.error("Teardown Error:", err);
  } finally {
    await client.end();
  }
};
