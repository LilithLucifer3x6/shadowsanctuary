require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  try {
    await client.connect();
    
    // Alter table wash_day_log
    await client.query(`
      ALTER TABLE wash_day_log 
      ADD COLUMN IF NOT EXISTS used_item_ids UUID[],
      ADD COLUMN IF NOT EXISTS blot_test_result TEXT,
      ADD COLUMN IF NOT EXISTS scratch_test_result TEXT
    `);
    
    console.log("Migration complete.");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
})();
