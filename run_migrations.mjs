import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgresql://postgres:NEMQqKLue247Yb3p@db.gwezojwujynharoqjuio.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  try {
    const queries = [
      "SELECT COUNT(*) as cnt FROM items;",
      "SELECT COUNT(*) as cnt FROM journal_entries;",
      "SELECT COUNT(*) as cnt FROM conflict_rules;",
      "SELECT COUNT(*) as cnt FROM user_profile;"
    ];
    for (const q of queries) {
      const res = await client.query(q);
      const tableName = q.match(/FROM\s+([a-zA-Z_]+)/)[1];
      console.log(`${tableName}: ${res.rows[0].cnt}`);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
