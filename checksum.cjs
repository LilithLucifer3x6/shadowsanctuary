const crypto = require('crypto');
const fs = require('fs');
const files = [
  'docs/proofs/desktop_background_rootwork.png',
  'docs/proofs/tablet_background_rootwork.png',
  'docs/proofs/mobile_background_rootwork.png',
  'docs/proofs/rootwork_the_echo.png',
  'docs/proofs/shadowtome_button_disabled.png',
  'docs/proofs/shadowtome_button_enabled.png',
  'docs/proofs/opacity_altars.png',
  'docs/proofs/opacity_rootwork.png',
  'docs/proofs/opacity_shadowtome.png',
];
const hashes = {};
for (const f of files) {
  if (!fs.existsSync(f)) { console.log('MISSING:', f); continue; }
  const h = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 16);
  hashes[f] = h;
  console.log(h, f);
}
// Check for duplicates
const seen = {};
for (const [f, h] of Object.entries(hashes)) {
  if (seen[h]) console.log('DUPLICATE:', f, '===', seen[h]);
  else seen[h] = f;
}
console.log('Done.');
