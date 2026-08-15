const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 414, height: 896 });
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Dump initial HTML to see where we are
  const html = await page.evaluate(() => document.body.innerHTML);
  console.log('INITIAL HTML:', html.substring(0, 500));

  try {
    // See if email input exists
    const email = await page.$('input[type="email"]');
    if (email) {
      console.log('Typing credentials...');
      await email.type('purpleirishlilli69@gmail.com');
      await page.type('input[type="password"]', 'purpleirishlilli69');
      
      // Wait for navigation after clicking
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {}),
        page.click('button.btn.plum')
      ]);
      
      console.log('Logged in successfully!');
    } else {
      console.log('No email input found. Are we already logged in?');
    }
    
    // Wait for the app shell to render
    await page.waitForSelector('.tb', { timeout: 5000 });
    console.log('Tabs are visible!');
  } catch(e) {
    console.log('Login error:', e.message);
  }
  
  const html2 = await page.evaluate(() => document.body.innerHTML);
  console.log('HTML AFTER LOGIN:', html2.substring(0, 500));

  await browser.close();
})();
