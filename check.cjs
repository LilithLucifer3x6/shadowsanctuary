const fs = require('fs');
let content = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8');
console.log(content.slice(0, 1000));
