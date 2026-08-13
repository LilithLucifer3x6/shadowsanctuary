const fs = require('fs');
let content = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');
const start = content.indexOf('<div className="tome-main-col"');
const end = content.indexOf('<div style={{ display: \'flex\', flexDirection: \'column\', gap: \'1.5rem\' }}>');
if(start !== -1 && end !== -1) {
  console.log(content.substring(start, end));
} else {
  console.log('Not found');
}
