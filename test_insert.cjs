require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testInsert() {
  const { data, error } = await supabase
    .from('journal_entries')
    .insert([{
      body_text: 'Hello this is a test entry after RLS fix 2',
      moods: ['joy']
    }])
    .select();
    
  console.log('Data:', data);
  console.log('Error:', error);
}

testInsert();
