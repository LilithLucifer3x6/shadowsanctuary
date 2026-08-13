import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const testEmail = 'test_1786474323159@gmail.com';
const testPassword = 'flux_test_password_123!';

async function main() {
  try {
    console.log("Signing in...");
    let res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    let authData = await res.json();
    if (authData.error) throw new Error(authData.error.message);
    const token = authData.access_token;
    console.log("Got JWT. Testing Mood Picker...");

    const payload = { model: 'claude-3-haiku-20240307',
      max_tokens: 250,
      system: "You are the Scrying Pool, a mystic oracle determining which three cosmetic/herbal properties best serve the user's current emotional state. Select exactly three from this list: ['hydration', 'exfoliation', 'soothing', 'brightening', 'anti-aging', 'barrier-repair', 'circulation', 'clarifying', 'mattifying', 'energizing']. Output ONLY a valid JSON array of three strings.",
      messages: [{ role: "user", content: "I am feeling weary and dull, like the gray fog of morning." }]
    };

    res = await fetch(`${supabaseUrl}/functions/v1/anthropic-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log("Status Code:", res.status);
    const responseText = await res.text();
    console.log("Response Body:", responseText);

  } catch (e) {
    console.error("Error:", e);
  }
}

main();
