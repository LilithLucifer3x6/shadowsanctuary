const fs = require('fs');

async function checkModels() {
    const envContent = fs.readFileSync('.env', 'utf-8');
    const token = envContent.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN')).split('=')[1].trim();

    try {
        const res = await fetch('https://api.replicate.com/v1/models?query=imagen-4', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        console.log("Models found:", data.results ? data.results.map(m => m.name) : data);
    } catch (e) {
        console.error("Error fetching:", e);
    }
}

checkModels();
