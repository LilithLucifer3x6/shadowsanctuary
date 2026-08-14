const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testUpload() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  console.log('Clicking Rootwork...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const t = tabs.find(t => t.textContent.includes('The Rootwork'));
    if (t) t.click();
  });
  
  await page.waitForTimeout(2000);
  
  console.log('Clicking Add Relic (+)...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('ph-plus'));
    if (btn) btn.click();
  });
  
  await page.waitForTimeout(2000);
  
  console.log('Finding file input...');
  const input = await page.$('input[type="file"][multiple]');
  if (input) {
    console.log('Input found! Uploading dummy image...');
    await input.setInputFiles(path.join(__dirname, 'public', 'assets', 'favicon.png'));
    await page.waitForTimeout(5000);
  } else {
    console.log('Input NOT found.');
  }
  
  await browser.close();
}

testUpload().catch(console.error);
