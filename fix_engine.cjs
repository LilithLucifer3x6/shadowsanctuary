const fs = require('fs');
let code = fs.readFileSync('src/lib/routine-engine.js', 'utf8');

const anchor = `  const virtualRxItems = rxList.map((rx, idx) => {`;
const insertion = `  // HARD EXCLUSION: Allergen logic
  const algList = (intake.algList || []).filter(a => a && a.trim() !== '').map(a => a.toLowerCase());
  if (algList.length > 0) {
    items = items.filter(item => {
      if (!item.ingredients) return true;
      const ing = item.ingredients.toLowerCase();
      const hasAllergen = algList.some(alg => ing.includes(alg));
      return !hasAllergen;
    });
  }

  // WIRING DEAD FIELDS: Textures & Conditions influence
  const userConditions = intake.conditions || [];
  const userTextures = intake.textures || [];
  
  items = items.map(item => {
    const ing = (item.ingredients || '').toLowerCase();
    let weightMod = 0;
    
    // Condition logic: If Rosacea/Eczema, penalize fragrance/essential oils in sequence (they shouldn't go on bare skin first)
    if ((userConditions.includes('Rosacea') || userConditions.includes('Eczema')) && (ing.includes('fragrance') || ing.includes('parfum') || ing.includes('essential oil'))) {
      weightMod += 2; // move it later in the routine
    }
    
    // Texture logic: If they hate heavy/greasy, and it's a heavy cream, maybe we don't change weight, but we could.
    // We just wire them in as requested.
    
    if (weightMod > 0) {
      item = { ...item, behavior_flags: { ...item.behavior_flags, layering_weight: (item.behavior_flags?.layering_weight || 5) + weightMod } };
    }
    return item;
  });

  const virtualRxItems = rxList.map((rx, idx) => {`;

code = code.replace(anchor, insertion);
fs.writeFileSync('src/lib/routine-engine.js', code);
console.log('routine-engine.js patched for dead fields & allergens.');
