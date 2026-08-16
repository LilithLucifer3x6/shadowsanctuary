const fs = require('fs');
let jsx = fs.readFileSync('src/screens/Intake.jsx', 'utf8');

// Fix concerns
jsx = jsx.replace(
  /onClick=\{\(\) => setSelectedConcerns\(\['na'\]\)\}/g,
  "onClick={() => setSelectedConcerns(prev => prev.includes('na') ? [] : ['na'])}"
);

// Fix conditions
jsx = jsx.replace(
  /onClick=\{\(\) => setSelectedConditions\(\['na'\]\)\}/g,
  "onClick={() => setSelectedConditions(prev => prev.includes('na') ? [] : ['na'])}"
);

// Fix textures
jsx = jsx.replace(
  /onClick=\{\(\) => setSelectedTextures\(\['na'\]\)\}/g,
  "onClick={() => setSelectedTextures(prev => prev.includes('na') ? [] : ['na'])}"
);

// Fix traditions
jsx = jsx.replace(
  /onClick=\{\(\) => setSelectedTraditions\(\['na'\]\)\}/g,
  "onClick={() => setSelectedTraditions(prev => prev.includes('na') ? [] : ['na'])}"
);

fs.writeFileSync('src/screens/Intake.jsx', jsx);
