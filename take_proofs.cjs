const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1080 });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));
  try {
    console.log("Navigating directly to Intake mock harness...");
    await page.goto('http://localhost:5173/?test_intake=1', { waitUntil: 'networkidle2' });
    
    // Give the app a moment to mount the Intake component
    await new Promise(r => setTimeout(r, 2000));
    await require('fs').promises.writeFile('docs/proofs/dom.html', await page.content());
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/wave2-0-intake-start.png', fullPage: true });

    console.log("Clicking The Swift Invocation...");
    // In Intake.jsx, the fast path button is text="The Swift Invocation"
    await page.waitForSelector('text=The Swift Invocation', { timeout: 10000 });
    await page.click('text=The Swift Invocation');

    console.log("--- Step 1: Skin Type ---");
    await page.waitForSelector("text=Help me divine this");
    await page.click("text=Help me divine this");
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/wave2-1-skin-quiz.png', fullPage: true });
    
    // Complete Skin Quiz
    await page.waitForSelector('text=Comfortable, not tight');
    await page.click('text=Comfortable, not tight');
    await page.waitForSelector('text=Only on my nose and forehead (T-Zone)');
    await page.click('text=Only on my nose and forehead (T-Zone)');
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/wave2-2-skin-result.png', fullPage: true });
    await page.click('text=Embrace this truth');
    await page.click('text=Step Deeper');

    console.log("--- Step 2: Scalp Type ---");
    await page.waitForSelector("text=Help me divine this");
    await page.click("text=Help me divine this");
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/wave2-3-scalp-quiz.png', fullPage: true });
    
    // Complete Scalp Quiz
    await page.waitForSelector('text=By the end of the first day');
    await page.click('text=By the end of the first day');
    await page.waitForSelector('text=No, rarely');
    await page.click('text=No, rarely');
    await page.waitForSelector('text=Small dry white flakes, or none at all');
    await page.click('text=Small dry white flakes, or none at all');
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/wave2-4-scalp-result.png', fullPage: true });
    await page.click('text=Embrace this truth');
    await page.click('text=Step Deeper');

    console.log("--- Step 3: Porosity ---");
    await page.waitForSelector("text=Help me divine this");
    await page.click("text=Help me divine this");
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/wave2-5-porosity-quiz.png', fullPage: true });
    
    // Complete Porosity
    await page.waitForSelector('text=It floats on the top');
    await page.click('text=It floats on the top');
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/wave2-6-porosity-result.png', fullPage: true });
    await page.click('text=Embrace this truth');
    await page.click('text=Step Deeper');
    
    // Step 4: Validate persistence UI
    await page.waitForSelector('text=What brings you to this place?');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/wave2-7-step4-continued.png', fullPage: true });
    
    // Click through to end
    await page.click('text=Relaxation, just for the sake of relaxation');
    await page.click('text=Step Deeper');
    await page.click('text=Not Applicable');
    await page.click('text=Step Deeper');
    await page.click('text=I have no preference');
    await page.click('text=Step Deeper');
    await page.click('text=I am burdened by no topical prescriptions.');
    await page.click('text=Step Deeper');
    await page.click('text=I consume no internal remedies that alter my vessel.');
    await page.click('text=Step Deeper');
    await page.click('text=I hold no other aversions.');
    await page.click('text=Step Deeper');
    await page.click('text=Not Applicable');
    await page.click('text=Enter the Sanctuary');
    
    await new Promise(r => setTimeout(r, 2000));
    console.log("Wave 2 Intake completed. Validating local mock state...");
    
    // Log localStorage state to prove completion
    const isCompleted = await page.evaluate(() => localStorage.getItem('mock_intake_done'));
    console.log("intake_completed mock state:", isCompleted);
    
    if (isCompleted === 'true') {
      console.log("SUCCESS! The state persisted.");
    }

  } catch (err) {
    console.error("Test Failed:", err);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/wave2-error.png', fullPage: true });
  } finally {
    await browser.close();
    try { await require('./test_teardown.cjs')(); } catch (e) {}
  }
})();

