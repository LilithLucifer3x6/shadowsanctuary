const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/repos/LilithLucifer3x6/shadowsanctuary/actions/workflows/supabase-backup.yml/runs',
  headers: {
    'User-Agent': 'Node.js',
    // We don't need auth for public repos, but if private, it might fail. Let's try public first.
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const runs = JSON.parse(data).workflow_runs;
      if (runs && runs.length > 0) {
        console.log(`Latest run status: ${runs[0].status}, conclusion: ${runs[0].conclusion}`);
        console.log(`Run URL: ${runs[0].html_url}`);
      } else {
        console.log('No runs found for this workflow.');
      }
    } else {
      console.error(`Error: ${res.statusCode} ${data}`);
    }
  });
}).on('error', (err) => console.error(err));
