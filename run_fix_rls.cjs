require('dotenv').config();
(async () => {
  const url = process.env.VITE_SUPABASE_URL + '/functions/v1/fix-rls';
  console.log('Fetching', url);
  
  const res = await fetch(url, { method: 'POST' });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
})();
