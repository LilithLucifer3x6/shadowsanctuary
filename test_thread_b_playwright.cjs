const { chromium } = require('playwright');

async function testShadowTome() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    page.on('pageerror', error => {
        errors.push(error.message);
    });

    try {
        console.log("Navigating to app...");
        await page.goto('http://localhost:5173');
        await page.waitForTimeout(2000);

        // Switch to Shadow Tome
        console.log("Navigating to Shadow Tome...");
        // Click the tab with text 'Shadow Tome' or look for the icon
        await page.locator('button[title="The Shadow Tome"]').click();
        await page.waitForTimeout(1000);

        // Ignite New Alchemy
        console.log("Testing: Ignite New Alchemy");
        await page.getByRole('button', { name: 'Ignite New Alchemy' }).click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'Abandon' }).click();
        await page.waitForTimeout(500);

        // Consecrate New Dram
        console.log("Testing: Consecrate New Dram");
        await page.getByRole('button', { name: 'Consecrate New Dram' }).click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'Abandon' }).click();
        await page.waitForTimeout(500);

        // Seek in the Codex
        console.log("Testing: Seek in the Codex");
        await page.getByRole('button', { name: 'Seek in the Codex' }).click();
        await page.waitForTimeout(500);
        // Fill form and submit to prevent validation blocking
        await page.getByPlaceholder('Brand / Lineage').fill('Test Brand');
        await page.getByPlaceholder('Product / Blend Name').fill('Test Tea');
        await page.getByRole('button', { name: 'Seek in the Codex' }).nth(1).click();
        await page.waitForTimeout(2000);
        await page.getByRole('button', { name: 'Close' }).click();
        await page.waitForTimeout(500);

        // To test Imbibe or Anoint the Elixir, we might need active items
        console.log("Looking for active tea to test Imbibe...");
        if (await page.getByRole('button', { name: 'Imbibe' }).count() > 0) {
            await page.getByRole('button', { name: 'Imbibe' }).first().click();
            await page.waitForTimeout(500);
            console.log("Clicked Imbibe.");
        } else {
            console.log("No tea available to Imbibe.");
        }

        console.log("Looking for active alchemy to test Anoint the Elixir...");
        if (await page.getByRole('button', { name: 'Anoint the Elixir' }).count() > 0) {
            await page.getByRole('button', { name: 'Anoint the Elixir' }).first().click();
            await page.waitForTimeout(500);
            console.log("Clicked Anoint the Elixir.");
        } else {
            console.log("No active alchemy to Anoint.");
        }

        console.log("\n--- TEST COMPLETE ---");
        console.log("Errors captured:", errors.length > 0 ? errors : "None!");

    } catch (e) {
        console.error("Test failed to execute:", e);
    } finally {
        await browser.close();
    }
}

testShadowTome();

