# WARNING: Do NOT run this script with terminal output visible/pasted anywhere.
# It reads keys directly from .env and passes them via command line.
# Output has been silenced, but the commands may still appear in your shell history.
$envContent = Get-Content .env
$anthropicKey = ($envContent | Where-Object { $_ -like "ANTHROPIC_API_KEY=*" }).Substring(19)
$replicateKey = ($envContent | Where-Object { $_ -like "REPLICATE_API_TOKEN=*" }).Substring(20)
npx supabase secrets set "ANTHROPIC_API_KEY=$anthropicKey" | Out-Null
npx supabase secrets set "REPLICATE_API_TOKEN=$replicateKey" | Out-Null
npx supabase secrets list

