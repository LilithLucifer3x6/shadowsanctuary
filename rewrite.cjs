const fs = require('fs');
let code = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');

const lines = code.split('\n');
const rootGridIdx = lines.findIndex(l => l.includes('className="rootwork-grid mt-4"'));
const echoEndIdx = lines.findIndex((l, i) => i > rootGridIdx && l.includes('The Silver Toll')) - 1;
const silverIdx = echoEndIdx + 1;
const silverEndIdx = lines.findIndex((l, i) => i > silverIdx && l.includes('The Summoning Scroll')) - 1;
const summonIdx = silverEndIdx + 1;
const summonEndIdx = lines.findIndex((l, i) => i > summonIdx && l.includes('The Waning')) - 1;
const waningIdx = summonEndIdx + 1;
const waningEndIdx = lines.findIndex((l, i) => i > waningIdx && l.includes('showAddModal')) - 3;

const newCode = [
  ...lines.slice(0, rootGridIdx),
  `      <div className="rootwork-grid mt-4" style={{ width: '100%', gap: '1.5rem' }}>`,
  `        {/* Left Column */}`,
  `        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>`,
  ...lines.slice(rootGridIdx + 1, echoEndIdx + 1).map(l => l.replace('mb-4', '').replace("width: '100%'", "width: '100%', height: 'auto'")),
  ...lines.slice(summonIdx, summonEndIdx + 1).map(l => l.replace('mb-4', '')),
  ...lines.slice(waningIdx, waningEndIdx + 1).map(l => l.replace('mb-4', '')),
  `        </div>`,
  `        {/* Right Column */}`,
  `        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>`,
  ...lines.slice(silverIdx, silverEndIdx + 1).map(l => l.replace('mb-4', '').replace("width: '100%'", "width: '100%', flex: 1")),
  `        </div>`,
  `      </div>`,
  ...lines.slice(waningEndIdx + 2)
].join('\n');

fs.writeFileSync('src/screens/Rootwork.jsx', newCode);
console.log('Done replacement.');
