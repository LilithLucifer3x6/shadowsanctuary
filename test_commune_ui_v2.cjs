const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Launching browser for Commune test...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');
    
    // Auth login
    console.log("Logging in...");
    await page.fill('input[type="email"]', 'test_1786474323159@gmail.com');
    await page.fill('input[type="password"]', 'flux_test_password_123!');
    await page.click('#login-submit');
    
    // Wait for the Dashboard
    console.log("Waiting for Dashboard to load...");
    await page.waitForSelector('.nav-item', { timeout: 10000 });
    
    // Click the Grimoire tab (the one with title="The Shadow Tome" or similar, or just click all nav items until we find Commune)
    // Actually let's just evaluate in page to find the Grimoire tab. It has an icon 'ph-book-open' or similar, but the exact text might be hidden.
    // Let's just find the button that triggers 'grimoire' screen.
    console.log("Switching to Grimoire tab...");
    await page.evaluate(() => {
      // Find all buttons, click the one whose inner text or title implies Grimoire/Shadow Tome
      const buttons = Array.from(document.querySelectorAll('button'));
      const grimoireBtn = buttons.find(b => b.title && b.title.includes('Shadow Tome'));
      if (grimoireBtn) grimoireBtn.click();
      else {
        // Fallback: just try to find a button with 'book' in its HTML
        const bookBtn = buttons.find(b => b.innerHTML.includes('ph-book'));
        if (bookBtn) bookBtn.click();
      }
    });

    // Wait a sec for state update
    await page.waitForTimeout(1000);

    console.log("Clicking 'Commune' button...");
    await page.click('button:has-text("Commune")');
    
    console.log("Checking if Reading Flow modal opened...");
    await page.waitForSelector('button:has-text("Deliver unto the Keeper")', { timeout: 5000 });
    
    console.log("SUCCESS: The Commune button successfully opened the Reading Flow modal in a live authenticated session.");
    const outPath = 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\1370394e-3b85-4504-bb15-db9d1cd803c0\\commune_modal_success.png';
    await page.screenshot({ path: outPath });
    console.log("Saved screenshot to " + outPath);

  } catch (err) {
    console.error("Test failed:", err.message);
    const failPath = 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\1370394e-3b85-4504-bb15-db9d1cd803c0\\commune_modal_fail.png';
    await page.screenshot({ path: failPath });
  } finally {
    await browser.close();
  }
}

main();
