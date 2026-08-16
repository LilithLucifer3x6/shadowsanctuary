const fs = require('fs');
let content = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8').split('\n');
// Delete lines 11 to 20
content.splice(10, 10);
// The syntax error is near the end. Let's print the last 15 lines.
console.log(content.slice(-15).join('\n'));
fs.writeFileSync('src/screens/ShadowTome.jsx', content.join('\n'));
