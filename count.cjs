const fs = require('fs');
const content = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8');
const openDivs = (content.match(/<div(\s|>)/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;
console.log('Open divs:', openDivs, 'Close divs:', closeDivs);
