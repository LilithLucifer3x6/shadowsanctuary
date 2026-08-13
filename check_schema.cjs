const fs = require('fs');

async function checkSchema() {
    const envContent = fs.readFileSync('.env', 'utf-8');
    const token = envContent.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN')).split('=')[1].trim();

    const res = await fetch('https://api.replicate.com/v1/models/google/nano-banana-pro', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
        console.error("Failed to fetch model:", await res.text());
        return;
    }
    
    const data = await res.json();
    
    if (data.latest_version && data.latest_version.openapi_schema) {
        console.log(JSON.stringify(data.latest_version.openapi_schema.components.schemas.Input.properties, null, 2));
    } else {
        console.log("No schema available.");
    }
}
checkSchema();
