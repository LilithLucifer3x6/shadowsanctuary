const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function setupTestUser() {
    const envContent = fs.readFileSync('.env', 'utf-8');
    
    let supabaseUrl = '';
    let anonKey = '';
    
    envContent.split('\n').forEach(line => {
        if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
        if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) anonKey = line.split('=')[1].trim();
    });

    const supabase = createClient(supabaseUrl, anonKey);
    const email = 'test.automation123987@gmail.com';
    const password = 'TestPassword123!';

    // Try standard signup
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });
    
    if (error) {
        console.error("Signup error:", error);
    } else {
        console.log("Signup success:", data);
    }
}

setupTestUser();
