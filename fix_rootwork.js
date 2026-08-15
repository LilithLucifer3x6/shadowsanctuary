const fs = require('fs');
let code = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');

const lines = code.split('\n');

const startIndex = lines.findIndex(l => l.includes('className="rootwork-grid mt-4"'));

// Find end of Echo (line 866)
// Find end of Silver Toll (line 922)
// Find end of Summoning Scroll (line 953)
// Find end of Waning (line 961)
// Find end of rootwork-grid (line 962)

// Actually, I can just use line numbers directly since I checked them.
// Let's verify line contents first.
console.log('821:', lines[820]);
console.log('822:', lines[821]);
console.log('867:', lines[866]);
console.log('868:', lines[867]);
console.log('923:', lines[922]);
console.log('924:', lines[923]);
console.log('954:', lines[953]);
console.log('955:', lines[954]);
console.log('962:', lines[961]);
console.log('963:', lines[962]);
