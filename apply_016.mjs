import { Client } from 'pg';
import fs from 'fs';

const client = new Client({
  connectionString: 'postgresql://postgres:NEMQqKLue247Yb3p@db.gwezojwujynharoqjuio.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  try {
    const sql = fs.readFileSync('supabase/migrations/016_alchemy_batches.sql', 'utf-8');
    await client.query(sql);
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await client.end();
  }
}

main();
