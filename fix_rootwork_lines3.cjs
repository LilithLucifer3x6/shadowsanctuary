const fs = require('fs');
const content = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');
const lines = content.split('\n');

const beforeGrid = lines.slice(0, 783); // Excludes 783 (tome-grid)
const silverToll = lines.slice(784, 825); // Excludes 825
const echo = lines.slice(825, 859); // Excludes 859 (which is the closing </div> for tome-grid)
const waning = lines.slice(861, 870); // Wait, 861 is rites2. We want 862.
const waningCard = lines.slice(862, 870); // Excludes 870
const summon = lines.slice(870, 902); // Excludes 902 (which is the closing </div> for rites2)
const afterGrid = lines.slice(903);

const newLines = [
  ...beforeGrid,
  '      <div className="tome-grid mt-4" style={{ width: \'100%\' }}>',
  '        <div className="tome-main-col" style={{ display: \'flex\', flexDirection: \'column\', gap: \'1.5rem\' }}>',
  ...summon,
  ...waningCard,
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
