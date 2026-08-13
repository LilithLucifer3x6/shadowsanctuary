require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSelect() {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .limit(1);
    
  console.log('Data:', data);
  console.log('Error:', error);
}

testSelect();
