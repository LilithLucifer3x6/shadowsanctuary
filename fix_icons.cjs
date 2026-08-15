const fs = require('fs');

function replaceFile(path, replacements) {
  let code = fs.readFileSync(path, 'utf8');
  for (const [search, replace] of replacements) {
    code = code.split(search).join(replace);
  }
  fs.writeFileSync(path, code);
}

// In Rites.jsx
replaceFile('src/screens/Rites.jsx', [
  ["if (item.name === 'The Minted Draught') return 'ph-flask';", "if (item.name === 'The Minted Draught') return 'ph-test-tube';"],
  ["if (item.name === 'The Purifying Stream') return 'ph-drop';", "if (item.name === 'The Purifying Stream') return 'ph-waves';"],
  ["renderScheduleStep('The Awakening', 'Allow 5 to 10 minutes for the veil of sleep to lift.', 'var(--crimson-b)', 'ph-sun')", "renderScheduleStep('The Awakening', 'Allow 5 to 10 minutes for the veil of sleep to lift.', 'var(--crimson-b)', 'ph-cloud-sun')"],
  ["renderScheduleStep('The Afternoon Respite', 'A 15-minute sanctuary. Imbibe 16 ounces of pure water.', 'var(--plum)', 'ph-coffee')", "renderScheduleStep('The Afternoon Respite', 'A 15-minute sanctuary. Imbibe 16 ounces of pure water.', 'var(--plum)', 'ph-mug')"],
  ["renderScheduleStep('The Descent', 'The day\\'s labors conclude. Begin the grounding process to sever ties with the work.', 'var(--plum)', 'ph-moon')", "renderScheduleStep('The Descent', 'The day\\'s labors conclude. Begin the grounding process to sever ties with the work.', 'var(--plum)', 'ph-bed')"]
]);

// In ShadowTome.jsx
replaceFile('src/screens/ShadowTome.jsx', [
  // The Stillroom currently uses ph-drop. Let's change it to ph-faucet or ph-bathtub?
  ['<i className="ph-duotone ph-drop"></i> The Stillroom', '<i className="ph-duotone ph-faucet"></i> The Stillroom'],
  // The Herbal Elixirs uses ph-flask. Apothecary in Rootwork uses ph-flask. Let's change Herbal Elixirs to ph-brandy.
  ['<i className="ph-duotone ph-flask"></i> The Herbal Elixirs', '<i className="ph-duotone ph-brandy"></i> The Herbal Elixirs']
]);

// Rootwork uses G.apothecary for Apothecary, which is 'flask'.
// It also uses ph-flask hardcoded: <Icon name="ph-flask" />
// We can leave Rootwork alone since it's the only one using flask now.

console.log('Fixed icon duplicates');
