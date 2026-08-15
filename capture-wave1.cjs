const puppeteer = require('puppeteer');
const fs = require('fs');
if (!fs.existsSync('docs/proofs')) fs.mkdirSync('docs/proofs', { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 414, height: 896 });

  page.on('dialog', async d => { console.log('Dialog:', d.message()); await d.accept(); });

  // 1. Screenshot the login screen showing forgot-password link
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('avatar_config', JSON.stringify({}));
    localStorage.setItem('intake_completed', 'true');
  });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#login-email', { timeout: 10000 });
  
  // Click "Lost your key" to show forgot-password form
  const forgotBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Lost your key'));
  });
  if (forgotBtn) await forgotBtn.click();
  await new Promise(r => setTimeout(r, 500));
  await page.evaluateHandle('document.fonts.ready');
  await page.screenshot({ path: 'docs/proofs/wave1-forgot-password.png', fullPage: true });
  console.log('Captured forgot-password screen');

  // 2. Login
  await page.type('#login-email', 'playwright_tester_99@gmail.com');
  await page.type('#login-password', 'password123');
  await page.click('#login-submit');
  await page.waitForSelector('button', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  // Click Awaken/Enter if on landing
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Awaken'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluateHandle('document.fonts.ready');

  // 3. Open Settings and screenshot the danger zone with confirmDestructive
  const gearBtn = await page.evaluateHandle(() => {
    return document.querySelector('[title="Configurations"]');
  });
  if (gearBtn) await gearBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  // Click "Shatter the First Inscription" to trigger the confirmDestructive dialog
  const shatterBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Shatter the First Inscription'));
  });
  if (shatterBtn) {
    await shatterBtn.click();
    await new Promise(r => setTimeout(r, 500));
    await page.evaluateHandle('document.fonts.ready');
    await page.screenshot({ path: 'docs/proofs/wave1-confirm-destructive-shatter.png', fullPage: true });
    console.log('Captured confirmDestructive dialog for Shatter');
    
    // Click Abandon to dismiss
    const abandonBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Abandon'));
    });
    if (abandonBtn) await abandonBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // Close settings
  const closeBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'X');
  });
  if (closeBtn) await closeBtn.click();
  await new Promise(r => setTimeout(r, 500));

  // 4. Go to Shadow Tome and trigger a destructive confirm on a tea shatter
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Shadow Tome');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Try to find a "Shatter Jar" button
  const shatterJar = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Shatter Jar'));
  });
  if (shatterJar && shatterJar.asElement()) {
    await shatterJar.click();
    await new Promise(r => setTimeout(r, 500));
    await page.evaluateHandle('document.fonts.ready');
    await page.screenshot({ path: 'docs/proofs/wave1-confirm-destructive-shatter-jar.png', fullPage: true });
    console.log('Captured confirmDestructive dialog for Shatter Jar');
    
    const abandon2 = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Abandon'));
    });
    if (abandon2) await abandon2.click();
  } else {
    console.log('No Shatter Jar button found (no teas stocked) - skipping');
  }

  // 5. Test ErrorBoundary by injecting a deliberate crash
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'The Mortal Rites');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Inject an error into the rendered content to trigger the ErrorBoundary
  const crashed = await page.evaluate(() => {
    try {
      // Deliberately corrupt a React internal to force a render error
      const container = document.getElementById('main-content');
      if (container) {
        const event = new CustomEvent('test-error-boundary');
        container.dispatchEvent(event);
      }
      return false;
    } catch(e) {
      return true;
    }
  });
  console.log('Error injection attempted:', crashed);

  await browser.close();
  console.log('Done!');
})();
