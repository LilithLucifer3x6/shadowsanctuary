const fs = require('fs');

let content = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8');

// 1. Remove `{alchemyForm ? ( ... ) : (`
content = content.replace(/{alchemyForm \? \([\s\S]*?\) : \(/, '');

// 2. Remove the closing `)}` of that ternary (it was right after the `The Alchemist's Scale` div)
content = content.replace(/<\/\s*div>\s*<\/div>\s*}\s*<div style={{ marginTop: '2rem', borderTop:/, '</div>\n\n              <div style={{ marginTop: \'2rem\', borderTop:');

fs.writeFileSync('src/screens/ShadowTome.jsx', content);
