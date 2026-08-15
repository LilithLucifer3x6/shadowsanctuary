require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function create() {
    const { data, error } = await supabase.auth.signUp({
        email: 'playwright_tester_99@gmail.com',
        password: 'realtestpassword123',
    });
    console.log('User:', data.user ? data.user.id : null, 'Error:', error);
}
create();
