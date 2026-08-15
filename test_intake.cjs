const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to local dev server...");
    await page.goto('http://localhost:5173/?bypass', { waitUntil: 'networkidle2' });

    console.log("Clicking The First Inscription...");
    await page.waitForSelector('text=The First Inscription');
    await page.click('text=The First Inscription');

    console.log("Clicking Fast Path (The Swift Invocation)...");
    await page.waitForSelector('text=The Swift Invocation');
    await page.click('text=The Swift Invocation');

    console.log("--- Step 1: Skin Type ---");
    await page.waitForSelector("text=Help me divine this");
    await page.click("text=Help me divine this");

    await page.waitForSelector('text=Comfortable, not tight');
    await page.click('text=Comfortable, not tight');

    await page.waitForSelector('text=Only on my nose and forehead (T-Zone)');
    await page.click('text=Only on my nose and forehead (T-Zone)');

    await page.waitForSelector('text=The signs reveal your vessel leans towards:');
    const skinResult = await page.evaluate(() => document.querySelector('.card .card, .card div[style*="capitalize"]').textContent);
    console.log("Skin Quiz Result:", skinResult);

    await page.click('text=Embrace this truth');

    await page.click('text=Step Deeper');

    console.log("--- Step 2: Scalp Type ---");
    await page.waitForSelector("text=Help me divine this");
    await page.click("text=Help me divine this");

    await page.waitForSelector('text=By the end of the first day');
    await page.click('text=By the end of the first day');

    await page.waitForSelector('text=No, rarely');
    await page.click('text=No, rarely');

    await page.waitForSelector('text=Small dry white flakes, or none at all');
    await page.click('text=Small dry white flakes, or none at all');

    await page.waitForSelector('text=The signs reveal your roots lean towards:');
    const scalpResult = await page.evaluate(() => document.querySelector('.card .card, .card div[style*="capitalize"]').textContent);
    console.log("Scalp Quiz Result:", scalpResult);

    await page.click('text=Embrace this truth');

    await page.click('text=Step Deeper');

    console.log("--- Step 3: Porosity ---");
    await page.waitForSelector("text=Help me divine this");
    await page.click("text=Help me divine this");

    await page.waitForSelector('text=It floats on the top');
    await page.click('text=It floats on the top');

    await page.waitForSelector('text=Your strands reveal their true nature:');
    const porosityResult = await page.evaluate(() => document.querySelector('.card .card, .card div[style*="capitalize"]').textContent);
    console.log("Porosity Quiz Result:", porosityResult);

    await page.click('text=Embrace this truth');
    
    await page.click('text=Step Deeper');
    
    await page.waitForSelector('text=What brings you to this place?');
    console.log("SUCCESS: Reached Step 4 after successfully completing Skin, Scalp, and Porosity quizzes!");

  } catch (err) {
    console.error("Test Failed:", err);
  } finally {
    await browser.close();
  }
})();
