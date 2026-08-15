const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgresql://postgres.gwezojwujynharoqjuio:NEMQqKLue247Yb3p@aws-1-us-west-2.pooler.supabase.com:5432/postgres' }); 
client.connect().then(() => client.query('UPDATE user_profile SET intake_completed = true WHERE id = $1', ['d0776d26-0946-45d3-8eec-63a4d2ffbf5e'])).then(res => { console.log('Updated:', res.rowCount); client.end() }).catch(err => console.error(err));
