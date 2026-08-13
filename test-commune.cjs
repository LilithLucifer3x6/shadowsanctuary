const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to a typical desktop size
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  console.log('Navigating to Grimoire screen...');
  
  // Wait a bit for render
  await new Promise(r => setTimeout(r, 2000));

  // Click on the navigation link that goes to Grimoire
  const clicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('span, a, button, div'));
    const grimoire = els.find(e => e.textContent && e.textContent.includes('The Grimoire'));
    if (grimoire) {
      grimoire.click();
      return true;
    }
    return false;
  });

  if (clicked) {
    console.log('Clicked Grimoire link');
    await new Promise(r => setTimeout(r, 1000));
  } else {
    console.log('Could not find Grimoire nav button');
  }

  console.log('Looking for Commune button...');
  const clickedCommune = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const communeBtn = btns.find(b => b.textContent && b.textContent.includes('Commune'));
    if (communeBtn) {
      communeBtn.click();
      return true;
    }
    return false;
  });

  if (clickedCommune) {
    console.log('Found Commune button. Clicking it...');
    
    console.log('Waiting 5 seconds for generation...');
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'commune_screenshot.png', fullPage: true });
    console.log('Screenshot saved to commune_screenshot.png');
  } else {
    console.log('Could not find Commune button. Taking screenshot of current state.');
    await page.screenshot({ path: 'commune_not_found.png', fullPage: true });
  }

  await browser.close();
})();
