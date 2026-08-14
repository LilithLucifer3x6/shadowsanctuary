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
    const buttons = Array.from(document.querySelectorAll('button'));
    const plusBtn = buttons.find(b => b.innerHTML.includes('ph-plus'));
    if (plusBtn) plusBtn.click();
  });
  
  await page.waitForTimeout(2000);
  
  console.log('Uploading photo...');
  const dummyImgPath = path.join(__dirname, 'public', 'assets', 'favicon.png');
  const input = await page.$('input[type="file"][multiple]');
  if (input) {
    await input.setInputFiles(dummyImgPath);
    console.log('File uploaded. Waiting for processing...');
    await page.waitForTimeout(8000); // Wait for AI
  } else {
    console.log('File input not found!');
  }
  
  await browser.close();
}

testUpload().catch(console.error);
