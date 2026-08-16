require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  try {
    await client.connect();
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'wash_day_log'");
    console.log(res.rows);
  } finally {
    await client.end();
  }
})();
