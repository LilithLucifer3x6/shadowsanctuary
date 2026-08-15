const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 414, height: 896 }
  });
  const page = await browser.newPage();

  try {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    console.log("Setting local storage...");
    await page.evaluate(() => {
      localStorage.setItem('avatar_config', JSON.stringify({}));
      localStorage.setItem('intake_completed', 'true');
    });
    
    console.log("Reloading...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    console.log("Logging in...");
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.type('#login-email', 'playwright_tester_99@gmail.com');
    await page.type('#login-password', 'password123');
    await page.click('#login-submit');
    await page.waitForSelector('button', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const enterBtn = btns.find(b => b.textContent.includes('Enter the Sanctuary'));
      if (enterBtn) enterBtn.click();
    });

    console.log("Waiting for tabs...");
    await page.waitForSelector('.tb', { timeout: 10000 });
    
    console.log("Clicking Grimoire tab...");
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.tb'));
      const tab = tabs.find(el => el.title === 'The Grimoire');
      if (tab) tab.click();
    });
    
    await new Promise(r => setTimeout(r, 3000));

    console.log("Looking for Commune button...");
    const clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Commune'));
      if (btn) {
        console.log("Found Commune button, clicking...");
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        btn.click();
        return true;
      }
      return false;
    });
    
    if (!clicked) {
      console.log("FAILED TO FIND COMMUNE BUTTON!");
      
    const html = await page.content();
    const fs = require('fs');
    fs.writeFileSync('dom_snapshot.html', html);
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/4-commune-regression.png', fullPage: true });


      process.exit(1);
    }

    console.log("Waiting for modal...");
    await page.waitForSelector('.modal', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 3000));
    
    const grimoireInput = await page.$('.modal textarea');
    if (grimoireInput) {
      console.log("Typing prompt...");
      await grimoireInput.type('My skin is feeling unusually dry this week. What herbs should I use?');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.modal button'));
        const btn = btns.find(b => b.textContent.includes('Deliver'));
        if (btn) btn.click();
      });
      
      console.log("Waiting for AI response...");
      await new Promise(r => setTimeout(r, 12000));
      
      console.log("Scrolling to AI response...");
      await page.evaluate(() => {
         const bots = Array.from(document.querySelectorAll('.msg-bot'));
         if (bots.length > 0) {
            bots[bots.length - 1].scrollIntoView({ behavior: 'instant', block: 'center' });
         } else {
            const modal = document.querySelector('.modal');
            if (modal) modal.scrollIntoView({ behavior: 'instant', block: 'start' });
         }
      });
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log("Taking screenshot...");
    
    const html = await page.content();
    const fs = require('fs');
    fs.writeFileSync('dom_snapshot.html', html);
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/4-commune-regression.png', fullPage: true });


    console.log("Success!");

  } catch (error) {
    console.error("Error:", error);
    await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/4-commune-error.png' });
  } finally {
    await browser.close();
  }
})();
