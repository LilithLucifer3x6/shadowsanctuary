const fs = require('fs');

async function run() {
  const token = fs.readFileSync('.env', 'utf8').split('\n').find(l => l.startsWith('REPLICATE_API_TOKEN')).split('=')[1].trim();
  const id = "mxbpp4kpa5rmy0czzmpr4b5jk0";
  
  while(true) {
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.status === 'succeeded' || data.status === 'failed') {
      fs.writeFileSync('replicate_raw_response_corrected.json', JSON.stringify(data, null, 2));
      console.log(`Status: ${data.status}`);
      if (data.status === 'succeeded' && data.output) {
        console.log(`Success! Output URL: ${data.output}`);
        const imageRes = await fetch(data.output);
        const buffer = await imageRes.arrayBuffer();
        const outPath = 'public/assets/avatar-tests/nano_banana_avatar_corrected.png';
        fs.writeFileSync(outPath, Buffer.from(buffer));
        console.log(`Saved output to ${outPath}`);
      }
      break;
    }
    console.log(`Status: ${data.status}... waiting 3s`);
    await new Promise(r => setTimeout(r, 3000));
  }
}

run();
