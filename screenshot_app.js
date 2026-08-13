import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  console.log("Navigating to http://localhost:5173/");
  await page.goto('http://localhost:5173/');
  
  // Wait for React to mount
  await page.waitForTimeout(2000);
  
  console.log("Taking screenshot of landing page...");
  await page.screenshot({ path: 'public/assets/avatar-tests/screenshot_landing.png' });

  // Let's set some avatar config in localStorage so we bypass Intake and go to the app
  await page.evaluate(() => {
    localStorage.setItem('intake_completed', 'true');
    localStorage.setItem('avatar_config', JSON.stringify({
      name: "The Shadow Weaver",
      locStyle: "Braided Crown",
      robeDesign: "Ceremonial Kimono",
      jewelry: "Crescent Moon",
      familiar: "Midnight Cat",
      layers: {
        hair: "swatch_hair_braids_crown_transparent.png",
        robe: "swatch_robe_kimono_ceremonial_transparent.png",
        jewelry: "swatch_jewelry_crescent_moon_transparent.png"
      }
    }));
  });

  console.log("Reloading to enter app with mock avatar config...");
  await page.reload();
  await page.waitForTimeout(3000);

  console.log("Taking screenshot of main app (Mortal Rites)...");
  await page.screenshot({ path: 'public/assets/avatar-tests/screenshot_mortal_rites.png' });

  // Click on "Conjure Visage" or navigate to Avatar screen
  await page.evaluate(() => {
    // We can manually set the state or click a button
    // The easiest way is to mock the session storage
    sessionStorage.setItem('al_currentScreen', 'avatar');
  });

  await page.reload();
  await page.waitForTimeout(3000);
  
  console.log("Taking screenshot of Conjure Visage...");
  // Fill some values if needed
  await page.screenshot({ path: 'public/assets/avatar-tests/screenshot_conjure_visage.png' });
  
  await browser.close();
  console.log("Done!");
}

run().catch(console.error);
