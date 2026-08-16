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

  // Use bypass to skip login
  await page.goto('http://localhost:5173/?bypass=true', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('BODY:', bodyText);

  // Try clicking "rites" tab directly by text
  async function clickTab(text) {
    await page.evaluate((t) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const el = buttons.find(b => b.textContent.includes(t));
      if (el) el.click();
      else console.log('NOT FOUND:', t);
    }, text);
    await new Promise(r => setTimeout(r, 1500));
  }

  await clickTab('The Rootwork');
  const path_rootwork = 'docs/proofs/FINAL_rootwork.png';
  await page.screenshot({ path: path_rootwork, fullPage: false });
  console.log('Rootwork hash:', hash(path_rootwork));

  await clickTab('The Altars');
  const path_altars = 'docs/proofs/FINAL_altars.png';
  await page.screenshot({ path: path_altars, fullPage: false });
  console.log('Altars hash:', hash(path_altars));

  await clickTab('The Shadow Tome');
  const path_tome = 'docs/proofs/FINAL_shadowtome.png';
  await page.screenshot({ path: path_tome, fullPage: false });
  console.log('ShadowTome hash:', hash(path_tome));

  // Mobile
  await page.setViewport({ width: 375, height: 812 });
  await clickTab('The Rootwork');
  const path_mobile = 'docs/proofs/FINAL_mobile_rootwork.png';
  await page.screenshot({ path: path_mobile, fullPage: false });
  console.log('Mobile hash:', hash(path_mobile));

  // Verify all different
  const hashes = [path_rootwork, path_altars, path_tome, path_mobile].map(hash);
  const dups = hashes.filter((h,i) => hashes.indexOf(h) !== i);
  if (dups.length > 0) console.log('DUPLICATES DETECTED:', dups);
  else console.log('ALL UNIQUE - no duplicate screenshots');

  await browser.close();
    try { await require('./test_teardown.cjs')(); } catch (e) {}
})();

