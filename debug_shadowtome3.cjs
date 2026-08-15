const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`));
  page.on('pageerror', err => console.error('[BROWSER ERROR]:', err.message));

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('intake_completed', 'true');
    localStorage.setItem('avatar_config', JSON.stringify({ name: "Test", avatarVibe: "witchy", familiar: "cat", layers: {} }));
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Now we should be logged in automatically because of App.jsx patch
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Navigating to Shadow Tome...");
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.tb');
    for (let t of tabs) {
      if (t.title && t.title.includes('Shadow Tome')) {
        t.click();
        return;
      }
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  
  const inShadowTome = await page.evaluate(() => document.body.innerText.includes('Inner Sanctum'));
  console.log("In Shadow Tome:", inShadowTome);

  if (inShadowTome) {
    console.log("Locating 'Ignite New Alchemy'...");
    const btnBox = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (let b of btns) {
        if (b.textContent.includes('Ignite New Alchemy')) {
          b.scrollIntoView({ block: 'center' });
          const rect = b.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
      }
      return null;
    });
    
    if (btnBox) {
      console.log(`Clicking at ${btnBox.x}, ${btnBox.y}`);
      
      // Inject listener to see what gets clicked
      await page.evaluate(() => {
        document.addEventListener('click', (e) => {
          console.log(`[CLICK INTERCEPTED BY]: <${e.target.tagName.toLowerCase()} class="${e.target.className}" id="${e.target.id}">`);
        }, { capture: true });
      });

      await page.mouse.click(btnBox.x, btnBox.y);
      console.log("Clicked via mouse!");
    } else {
      console.log("Button not found!");
    }

    await new Promise(r => setTimeout(r, 500));
    const isModalOn = await page.evaluate(() => {
      const el = document.querySelector('.modal');
      return el !== null;
    });
    console.log("Is modal in DOM?", isModalOn);
    
    const isModalVisible = await page.evaluate(() => {
      const el = document.querySelector('.modal');
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });
    console.log("Is modal visually visible?", isModalVisible);
  }

  await browser.close();
})();
