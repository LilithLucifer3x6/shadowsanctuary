const puppeteer = require('puppeteer');

(async () => {
  console.log("Starting Thread B Tests...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('http://localhost:5173/');
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'test@example.com');
  await page.type('input[type="password"]', 'pass');
  await page.evaluate(() => document.querySelector('form button').click());
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
      localStorage.setItem('intake_completed', 'true');
      sessionStorage.setItem('al_currentScreen', 'app');
  });
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));

  console.log("\n--- COMMUNE RAPID CLICK TEST ---");
  await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.tabs button'));
      const rootTab = tabs.find(t => t.textContent.includes('Rootwork'));
      if (rootTab) rootTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Find the commune button
  const communeResult = await page.evaluate(async () => {
      const btns = Array.from(document.querySelectorAll('button'));
      const communeBtn = btns.find(b => b.textContent.includes('Commune with the Algorithm'));
      if (!communeBtn) return "Commune button not found";
      
      let clickCount = 0;
      let disableCount = 0;
      
      // Rapid click 5 times
      for(let i=0; i<5; i++) {
          if (communeBtn.disabled) {
              disableCount++;
          } else {
              communeBtn.click();
              clickCount++;
          }
      }
      return `Clicked ${clickCount} times before disabled. Disabled encountered ${disableCount} times on rapid fire.`;
  });
  console.log(communeResult);
  await new Promise(r => setTimeout(r, 2000));


  console.log("\n--- SCRYING POOL ZONES TEST ---");
  await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.tabs button'));
      const scryTab = tabs.find(t => t.textContent.includes('Scrying'));
      if (scryTab) scryTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const scryingResult = await page.evaluate(async () => {
      // Find the visual zones (Grin/Veil/Abyss)
      const visualZone = document.querySelector('.scrying-visual');
      if (!visualZone) return "Scrying visual zone not found.";
      
      const bounds = visualZone.getBoundingClientRect();
      const results = [];
      
      // We will mock clicks at specific percentage coordinates to hit the overlay rects
      const clickAt = (xPercent, yPercent) => {
          const x = bounds.left + (bounds.width * xPercent);
          const y = bounds.top + (bounds.height * yPercent);
          const evt = new MouseEvent('click', { clientX: x, clientY: y, bubbles: true });
          visualZone.dispatchEvent(evt);
      };

      // The Grin is roughly top center (e.g. x: 50%, y: 20%)
      clickAt(0.5, 0.2);
      await new Promise(resolve => setTimeout(resolve, 500));
      let state = document.querySelector('h2.scrying-title')?.textContent || 'Unknown';
      results.push(`Click Top-Center -> Selected State: ${state}`);

      // The Veil is roughly bottom center (e.g. x: 50%, y: 80%)
      clickAt(0.5, 0.8);
      await new Promise(resolve => setTimeout(resolve, 500));
      state = document.querySelector('h2.scrying-title')?.textContent || 'Unknown';
      results.push(`Click Bottom-Center -> Selected State: ${state}`);

      return results.join('\n');
  });
  console.log(scryingResult);

  await browser.close();
})();
