const puppeteer = require('puppeteer');
const fs = require('fs');
const crypto = require('crypto');

function hash(p) {
  if (!fs.existsSync(p)) return 'FILE_MISSING';
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0,16);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Load app first to set localStorage
  await page.goto('http://localhost:5173/?bypass=true', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Inject a mock avatar_config so the app shows the main screen with tabs
  await page.evaluate(() => {
    localStorage.setItem('avatar_config', JSON.stringify({
      name: 'Test',
      generatedBgs: {},
    }));
  });

  // Reload to pick up the config
  await page.reload({ waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('BODY:', bodyText);

  const tabs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .map(b => b.textContent.trim()).filter(t => t.length > 1 && t.length < 60);
  });
  console.log('Buttons:', JSON.stringify(tabs));

  async function clickTab(text) {
    await page.evaluate((t) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const el = buttons.find(b => b.textContent.includes(t));
      if (el) { el.click(); return true; }
      return false;
    }, text);
    await new Promise(r => setTimeout(r, 1500));
  }

  // Rootwork desktop
  await clickTab('The Rootwork');
  await page.screenshot({ path: 'docs/proofs/FINAL_rootwork.png' });
  console.log('rootwork hash:', hash('docs/proofs/FINAL_rootwork.png'));

  // Altars desktop
  await clickTab('The Altars');
  await page.screenshot({ path: 'docs/proofs/FINAL_altars.png' });
  console.log('altars hash:', hash('docs/proofs/FINAL_altars.png'));

  // Shadow Tome desktop
  await clickTab('The Shadow Tome');
  await page.screenshot({ path: 'docs/proofs/FINAL_shadowtome.png' });
  console.log('shadowtome hash:', hash('docs/proofs/FINAL_shadowtome.png'));

  // Mobile Rootwork
  await page.setViewport({ width: 375, height: 812 });
  await clickTab('The Rootwork');
  await page.screenshot({ path: 'docs/proofs/FINAL_mobile_rootwork.png' });
  console.log('mobile rootwork hash:', hash('docs/proofs/FINAL_mobile_rootwork.png'));

  // Tablet
  await page.setViewport({ width: 768, height: 1024 });
  await clickTab('The Shadow Tome');
  await page.screenshot({ path: 'docs/proofs/FINAL_tablet_shadowtome.png' });
  console.log('tablet shadowtome hash:', hash('docs/proofs/FINAL_tablet_shadowtome.png'));

  // Disabled Bind the Parchment button
  await page.setViewport({ width: 1280, height: 900 });
  await clickTab('The Shadow Tome');
  const bindBtn = await page.$('#btn-save-tome');
  if (bindBtn) {
    const isDisabled = await page.evaluate(el => el.disabled, bindBtn);
    console.log('Bind button disabled:', isDisabled);
  }
  await page.screenshot({ path: 'docs/proofs/FINAL_shadowtome_disabled_btn.png' });
  console.log('disabled btn hash:', hash('docs/proofs/FINAL_shadowtome_disabled_btn.png'));

  // Verify uniqueness
  const paths = ['docs/proofs/FINAL_rootwork.png','docs/proofs/FINAL_altars.png','docs/proofs/FINAL_shadowtome.png','docs/proofs/FINAL_mobile_rootwork.png','docs/proofs/FINAL_tablet_shadowtome.png'];
  const hashes = paths.map(hash);
  const seen = {};
  for(let i=0; i<paths.length; i++) {
    if(seen[hashes[i]]) console.log('DUPLICATE:', paths[i], '===', seen[hashes[i]]);
    else seen[hashes[i]] = paths[i];
  }
  console.log('Uniqueness check done');

  await browser.close();
    try { await require('./test_teardown.cjs')(); } catch (e) {}
})();

