const fs = require('fs');
let code = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');

const injection = `
    // Lavender Ban Check
    const allText = \`\${item.name || ''} \${item.brand || ''} \${Array.isArray(item.ingredients) ? item.ingredients.join(' ') : (item.ingredients || '')}\`;
    if (/(lavender|lavandula|lavandin)/i.test(allText)) {
      await alert("LAVENDER DETECTED: This item contains Lavender (or a derivative) and is permanently banned from your routine. It must be sealed in the Crypt of Ashes.");
      return false;
    }
`;

code = code.replace(/const validateItemForSave = async \(item\) => \{\s*\/\/ 0\. Type Check/, (match) => {
  return 'const validateItemForSave = async (item) => {\n' + injection + '    // 0. Type Check';
});

fs.writeFileSync('src/screens/Rootwork.jsx', code);
console.log('Injected into Rootwork');
