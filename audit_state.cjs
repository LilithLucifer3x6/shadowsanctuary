const puppeteer = require('puppeteer');
const fs = require('fs');

async function runAudit() {
  console.log('Starting state-based app audit via Puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const clickByText = async (text, selector = '*') => {
      const elements = await page.$$(`::-p-xpath(//${selector}[contains(text(), '${text}')])`);
      if (elements.length > 0) {
          await elements[0].click();
          await wait(1000);
          return true;
      }
      return false;
  };
  
  const proofDir = 'public/assets/avatar-tests/proofs';

  // Navigate home
  await page.goto('http://localhost:5173/');
  await wait(2000);
  
  try {
      await clickByText('Skip Login');
  } catch(e) {}

  // Test 1: Alchemy Modal Centering
  console.log('Testing Alchemy Modal Centering...');
  await page.goto('http://localhost:5173/');
  await wait(1000);
  await clickByText('Alchemy', 'button');
  await wait(1000);
  await page.screenshot({ path: `${proofDir}/alchemy_modal_desktop.png` });
  
  await page.setViewport({ width: 375, height: 812 });
  await wait(1000);
  await page.screenshot({ path: `${proofDir}/alchemy_modal_mobile.png` });
  
  await page.keyboard.press('Escape');
  await page.setViewport({ width: 1280, height: 800 });
  await wait(1000);

  // Test 2: Rootwork / Dram Leak
  console.log('Testing Rootwork and Dram leak...');
  await page.goto('http://localhost:5173/rootwork');
  await wait(2000);
  // Attempt to create test tea/honey if buttons exist
  await clickByText('Add');
  await wait(1000);
  await page.screenshot({ path: `${proofDir}/rootwork_creation.png` });
  
  console.log('Checking Rites for leak...');
  await page.goto('http://localhost:5173/rites');
  await wait(2000);
  await page.screenshot({ path: `${proofDir}/rites_leak_check.png` });

  // Test 3: Dose Accumulation
  console.log('Testing Dose Accumulation...');
  await clickByText('Took');
  await wait(1000);
  await clickByText('Took');
  await wait(1000);
  await page.screenshot({ path: `${proofDir}/dose_accumulation.png` });

  // Test 4: Stillroom
  console.log('Testing Stillroom...');
  await page.goto('http://localhost:5173/grimoire'); // Assuming Stillroom is in Grimoire
  await wait(2000);
  await page.screenshot({ path: `${proofDir}/stillroom_check.png` });

  console.log('State audit complete.');
  await browser.close();
}

runAudit().catch(console.error);
