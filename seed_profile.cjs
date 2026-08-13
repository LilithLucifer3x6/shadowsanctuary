const { Client } = require('pg');
const fs = require('fs');

async function seedProfile() {
    const envContent = fs.readFileSync('.env', 'utf-8');
    let dbUrl = '';
    envContent.split('\n').forEach(line => {
        if (line.startsWith('SUPABASE_DB_URL=')) dbUrl = line.split('=')[1].trim();
    });

    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    const email = 'test-automation@shadowsanctuary.local';
    
    try {
        const check = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
        if (check.rows.length === 0) {
            console.error("User not found!");
            return;
        }
        
        const userId = check.rows[0].id;
        console.log("User ID:", userId);

        const profileCheck = await client.query('SELECT id FROM public.user_profile WHERE id = $1', [userId]);
        if (profileCheck.rows.length === 0) {
            await client.query(`
                INSERT INTO public.user_profile (id, intake_completed, avatar_config)
                VALUES ($1, true, '{"name": "Test Witch", "avatarVibe": "none"}'::jsonb)
            `, [userId]);
        } else {
            await client.query(`
                UPDATE public.user_profile SET
                    intake_completed = true,
                    avatar_config = '{"name": "Test Witch", "avatarVibe": "none"}'::jsonb
                WHERE id = $1
            `, [userId]);
        }
        console.log("Profile seeded successfully for test user.");
        
    } catch (e) {
        console.error("Error creating user profile:", e);
    } finally {
        await client.end();
    }
}

seedProfile();
