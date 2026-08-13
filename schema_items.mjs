import fs from 'fs';
import pg from 'pg';
const { Client } = pg;
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((a, l) => { const [k, ...v] = l.split('='); if(k) a[k.trim()] = v.join('=').trim(); return a; }, {});
const client = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(() => client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'items'")).then(res => console.log(res.rows)).catch(console.error).finally(() => client.end());
