const puppeteer = require('puppeteer');
const fs = require('fs');
const wait = ms => new Promise(r => setTimeout(r, ms));

const DATA_DIR = 'C:/Users/purpl/shadowsanctuary/docs/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('avatar_config', JSON.stringify({ preset: 'default' }));
    sessionStorage.setItem('al_currentScreen', 'app');
    sessionStorage.setItem('al_activeTab', 'rites');
    localStorage.setItem('intake_completed', 'true');
  });

  console.log("Loading app...");
  await page.goto('http://localhost:5174');
  await page.waitForSelector('.tabs', { timeout: 10000 });
  await wait(1000);

  // 1. Wash Day Ledger
  console.log("1. Wash Day Ledger...");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const grimTab = tabs.find(t => t.innerText.includes('Grimoire'));
    if(grimTab) grimTab.click();
  });
  await wait(2000);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const washBtn = btns.find(b => b.innerText.includes('Log Wash Day'));
    if(washBtn) washBtn.click();
  });
  await wait(1500);
  await page.screenshot({ path: DATA_DIR + '/test_wash_day.png' });
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const abandonBtn = btns.find(b => b.innerText === 'Abandon');
    if(abandonBtn) abandonBtn.click();
  });
  await wait(1000);

  // 2. Shadow Tome disabled
  console.log("2. Shadow Tome disabled...");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const tomeTab = tabs.find(t => t.innerText.includes('Shadow Tome'));
    if(tomeTab) tomeTab.click();
  });
  await wait(2000);
  await page.screenshot({ path: DATA_DIR + '/test_shadow_tome_disabled.png' });

  // 3. Shadow Tome enabled
  console.log("3. Shadow Tome enabled...");
  await page.evaluate(() => {
    const sel = document.querySelector('select');
    if (sel) { sel.value = 'Mugwort'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await wait(1000);
  await page.screenshot({ path: DATA_DIR + '/test_shadow_tome_enabled.png' });

  // 4. Scrying Pool
  console.log("4. Scrying Pool...");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const scryTab = tabs.find(t => t.innerText.includes('Scrying Pool'));
    if(scryTab) scryTab.click();
  });
  await wait(1500);
  await page.screenshot({ path: DATA_DIR + '/test_scrying_pool.png' });

  // 5. Reading check-in (Divine Reading tCheck)
  console.log("5. Reading check-in...");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const grimTab = tabs.find(t => t.innerText.includes('Grimoire'));
    if(grimTab) grimTab.click();
  });
  await wait(2000);
  await page.screenshot({ path: DATA_DIR + '/test_reading_logic.png' }); 

  // 6. Crypt restore
  console.log("6. Crypt restore...");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const scryTab = tabs.find(t => t.innerText.includes('Scrying Pool'));
    if(scryTab) scryTab.click();
  });
  await wait(1500);
  await page.evaluate(() => {
    // Open Crypt of Ashes
    const btns = Array.from(document.querySelectorAll('h3'));
    const cryptBtn = btns.find(b => b.innerText.includes('Crypt of Ashes'));
    if(cryptBtn) cryptBtn.scrollIntoView();
  });
  await wait(1000);
  await page.screenshot({ path: DATA_DIR + '/test_rootwork_restore.png' });

  // 7. Font settings after reload
  console.log("7. Font settings after reload...");
  await page.evaluate(() => {
    const cog = document.querySelector('.ph-gear');
    if(cog) cog.parentElement.click();
  });
  await wait(1000);
  await page.evaluate(() => {
    const sel = document.querySelectorAll('select')[0];
    if (sel) { sel.value = 'Lora'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await wait(1000);
  await page.reload();
  await page.waitForSelector('.tabs', { timeout: 10000 });
  await wait(2000);
  await page.evaluate(() => {
    const cog = document.querySelector('.ph-gear');
    if(cog) cog.parentElement.click();
  });
  await wait(1500);
  await page.screenshot({ path: DATA_DIR + '/test_font_persisted.png' });

  await browser.close();
  console.log("All screenshots successfully captured.");
})();
