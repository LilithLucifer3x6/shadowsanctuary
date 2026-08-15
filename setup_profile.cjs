require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function create() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'playwright_tester_99@gmail.com',
        password: 'realtestpassword123',
    });
    if (data?.user) {
        const { error: profileErr } = await supabase.from('user_profile').insert([{
            id: data.user.id,
            display_name: 'Playwright Tester',
            settings: {}
        }]);
        console.log('Profile Insert:', profileErr);
    }
}
create();
