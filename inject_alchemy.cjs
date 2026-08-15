const fs = require('fs');
let code = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8');

const injection = `
    // Lavender Check
    if (/(lavender|lavandula|lavandin)/i.test(alchemyForm.name || '')) {
      await alert("LAVENDER DETECTED: This alchemy contains Lavender and is permanently banned. It will not be crafted.");
      return;
    }
`;

code = code.replace(/const handleSaveAlchemy = async \(\) => \{\s*if \(!alchemyForm.name/, (match) => {
  return 'const handleSaveAlchemy = async () => {\n' + injection + '      if (!alchemyForm.name';
});

fs.writeFileSync('src/screens/ShadowTome.jsx', code);
console.log('Injected into Alchemy');
