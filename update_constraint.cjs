const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:NEMQqKLue247Yb3p@db.gwezojwujynharoqjuio.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE items DROP CONSTRAINT IF EXISTS items_domain_check;
      ALTER TABLE items ADD CONSTRAINT items_domain_check CHECK (domain IN ('Crown', 'Gaze', 'Grin', 'Visage', 'Form', 'Vessel', 'Measure'));
    `);
    console.log('Successfully updated constraint.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
