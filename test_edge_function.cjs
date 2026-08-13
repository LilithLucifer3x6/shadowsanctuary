require('dotenv').config();
(async () => {
  const url = process.env.VITE_SUPABASE_URL + '/functions/v1/anthropic-proxy';
  console.log('Fetching', url);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'hello' }],
      system: 'test'
    })
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
})();
