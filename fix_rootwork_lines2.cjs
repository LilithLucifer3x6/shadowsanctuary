const fs = require('fs');
const content = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');
const lines = content.split('\n');

const beforeGrid = lines.slice(0, 783); // exclude tome-grid line itself
const silverToll = lines.slice(784, 825);
const echo = lines.slice(825, 860);
const waning = lines.slice(861, 870);
const summon = lines.slice(870, 902);
const afterGrid = lines.slice(903);

const newLines = [
  ...beforeGrid,
  '      <div className="tome-grid mt-4" style={{ width: \'100%\' }}>',
  '        <div className="tome-main-col" style={{ display: \'flex\', flexDirection: \'column\', gap: \'1.5rem\' }}>',
  ...summon,
  ...waning,
  ...silverToll,
  '        </div>',
  '        <div style={{ display: \'flex\', flexDirection: \'column\', gap: \'1.5rem\' }}>',
  ...echo,
  '        </div>',
  '      </div>',
  ...afterGrid
];

fs.writeFileSync('src/screens/Rootwork.jsx', newLines.join('\n'));
console.log('done layout fix');
