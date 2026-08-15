const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgresql://postgres.gwezojwujynharoqjuio:NEMQqKLue247Yb3p@aws-1-us-west-2.pooler.supabase.com:5432/postgres' }); 
client.connect().then(() => client.query('UPDATE auth.users SET email_confirmed_at = now() WHERE email = $1', ['playwright_tester_99@gmail.com'])).then(res => { console.log('Updated:', res.rowCount); client.end() }).catch(err => console.error(err));
