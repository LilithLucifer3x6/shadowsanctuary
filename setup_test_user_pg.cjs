const { Client } = require('pg');
const fs = require('fs');
const crypto = require('crypto');

async function createTestUser() {
    const envContent = fs.readFileSync('.env', 'utf-8');
    let dbUrl = '';
    envContent.split('\n').forEach(line => {
        if (line.startsWith('SUPABASE_DB_URL=')) dbUrl = line.split('=')[1].trim();
    });

    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    const email = 'test-automation@shadowsanctuary.local';
    const password = 'TestPassword123!';
    
    try {
        const check = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
        let userId;

        if (check.rows.length === 0) {
            userId = crypto.randomUUID();
            await client.query(`
                INSERT INTO auth.users (
                    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
                    recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
                    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
                )
                VALUES (
                    $1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, 
                    crypt($3, gen_salt('bf')), now(), 
                    NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', 
                    now(), now(), '', '', '', ''
                )
            `, [userId, email, password]);
            console.log("User created in auth.users.");
        } else {
            userId = check.rows[0].id;
            await client.query(`
                UPDATE auth.users SET 
                    encrypted_password = crypt($2, gen_salt('bf')),
                    email_confirmed_at = now()
                WHERE id = $1
            `, [userId, password]);
            console.log("User updated in auth.users.");
        }

        const idCheck = await client.query('SELECT id FROM auth.identities WHERE user_id = $1', [userId]);
        if (idCheck.rows.length === 0) {
            await client.query(`
                INSERT INTO auth.identities (
                    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
                )
                VALUES (
                    $1, $1, json_build_object('sub', $1::text, 'email', $2::text), 'email', now(), now(), now()
                )
            `, [userId, email]);
            console.log("Identity created.");
        }

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
        console.error("Error creating user:", e);
    } finally {
        await client.end();
    }
}

createTestUser();
