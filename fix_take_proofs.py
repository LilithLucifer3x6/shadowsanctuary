import sys

with open('take-proofs.cjs', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Fix Shadow Tome: add scrollIntoView BEFORE taking the empty state screenshot.
shadow_tome_fix = """
    // Scroll to the button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Bind the Parchment'));
      if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 500));
    
    // Empty state (button disabled)"""
text = text.replace('    // Empty state (button disabled)', shadow_tome_fix)

# 2. Fix Commune: add scrollIntoView and wait 2000ms.
commune_original = """    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.trim() === 'Commune');
      if (btn) btn.click();
    });"""

commune_fix = """    await new Promise(r => setTimeout(r, 1000)); // wait extra just in case
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.trim() === 'Commune');
      if (btn) {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' });
        btn.click();
      }
    });"""

text = text.replace(commune_original, commune_fix)

with open('take-proofs.cjs', 'w', encoding='utf-8') as f:
    f.write(text)

print("Success")
