const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.gwezojwujynharoqjuio:NEMQqKLue247Yb3p@aws-1-us-west-2.pooler.supabase.com:5432/postgres' });
client.connect().then(() => {
  return client.query(`UPDATE auth.users SET encrypted_password = crypt('password123', gen_salt('bf')) WHERE email = 'playwright_tester_99@gmail.com'`);
}).then(res => {
  console.log('updated:', res.rowCount);
  client.end();
}).catch(console.error);
