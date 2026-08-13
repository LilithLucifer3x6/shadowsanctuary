const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:NEMQqKLue247Yb3p@db.gwezojwujynharoqjuio.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  try {
    await client.query(`DELETE FROM alchemy_batches WHERE name LIKE 'TEST - DO NOT USE%';`);
    await client.query(`DELETE FROM items WHERE name LIKE 'TEST - DO NOT USE%';`);
    console.log('Successfully cleaned up test data.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
