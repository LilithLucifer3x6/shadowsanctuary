const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Try loading from .env
  const envContent = fs.readFileSync(path.resolve('.env'), 'utf8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
  if (urlMatch) process.env.VITE_SUPABASE_URL = urlMatch[1].trim();
  if (keyMatch) process.env.VITE_SUPABASE_ANON_KEY = keyMatch[1].trim();
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function injectAvatar() {
  // login
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'test-automation@shadowsanctuary.local',
    password: 'TestPassword123!'
  });
  if (error) {
    console.error('Login failed:', error.message);
    return;
  }
  
  const { data: profile } = await supabase.from('user_profile').select('id').order('created_at', { ascending: false }).limit(1).single();
  
  const config = {
    name: 'Lilith',
    locStyle: 'Braided Crown',
    robeDesign: 'Forest Green Velvet',
    jewelry: 'Spider Brooch',
    familiar: 'Midnight Cat',
    familiarId: 'cat',
    layers: {
      hair: 'swatch_hair_braids_crown_transparent.png',
      robe: 'swatch_robe_forest_green_velvet_transparent.png',
      jewelry: 'swatch_jewelry_spider_brooch_transparent.png'
    }
  };

  const { error: updateErr } = await supabase.from('user_profile').update({
    avatar_config: config,
    intake_completed: true
  }).eq('id', profile.id);

  if (updateErr) {
    console.error('Failed to update avatar config:', updateErr);
  } else {
    console.log('Avatar config successfully injected into Supabase!');
  }
}

injectAvatar().catch(console.error);
