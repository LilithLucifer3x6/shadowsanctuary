const fs = require('fs');
let code = fs.readFileSync('src/screens/Rites.jsx', 'utf8');

code = code.replace(/,\s*fontSize:\s*'1\.25rem'/g, '');
code = code.replace(/fontSize:\s*'1\.25rem'\s*,?/g, '');

fs.writeFileSync('src/screens/Rites.jsx', code);
console.log('Fixed h3 sizes');
