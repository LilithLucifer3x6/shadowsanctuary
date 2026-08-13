require('dotenv').config();
const { Client } = require('pg');

async function run() {
    const url = process.env.SUPABASE_DB_URL;
    const client = new Client({ connectionString: url });
    await client.connect();
    try {
        const res = await client.query('SELECT id, intake_completed, avatar_config FROM user_profile');
        console.log("DB RAW ROW DATA:");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
