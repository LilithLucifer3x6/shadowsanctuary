import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro', {
  headers: {
    Authorization: 'Token ' + env.REPLICATE_API_TOKEN
  }
}).then(r=>r.json()).then(async j => {
  console.log("Model metadata:");
  if (j.latest_version && j.latest_version.openapi_schema) {
     console.log(JSON.stringify(j.latest_version.openapi_schema.components.schemas.Input, null, 2));
  } else {
     // sometimes flux models don't have versions (they are hardware deployments)
     // let's check /models/... for raw schema if any
     console.log("No latest_version OpenAPI schema found. Full response:");
     console.log(j);
  }
});
