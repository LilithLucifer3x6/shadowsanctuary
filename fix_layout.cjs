const fs = require('fs');
let text = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');

const tollStart = text.indexOf('<div className="card mb-4" style={{ marginBottom: 0, alignSelf: \'start\', width: \'100%\' }}>');
const tollEnd = text.indexOf('<div className="card mb-4" style={{ marginBottom: 0, width: \'100%\' }}>');
const tollBlock = text.substring(tollStart, tollEnd);

const echoStart = tollEnd;
const echoEnd = text.indexOf('</div>\n      </div>\n\n      <div className="rites2 mt-4" style={{ width: \'100%\' }}>');
const echoBlock = text.substring(echoStart, echoEnd);

const waningStart = text.indexOf('<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n          <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n          <h3 style={{ justifyContent: \'center\' }}>The Waning');
const waningEnd = text.indexOf('<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n          <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n          <h3 style={{ justifyContent: \'center\' }}>The Summoning Scroll');
const waningBlock = text.substring(waningStart, waningEnd);

const summonStart = waningEnd;
const summonEnd = text.indexOf('</div>\n        </div>\n      </div>\n\n      {modalState && (');
const summonBlock = text.substring(summonStart, summonEnd + 14);

const before = text.substring(0, text.indexOf('<div className="tome-grid mt-4" style={{ width: \'100%\' }}>') + 58);
const after = text.substring(summonEnd + 14);

const newLayout = `
        <div className="tome-main-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
${summonBlock}
${waningBlock}
${tollBlock}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
${echoBlock}
        </div>
`;

fs.writeFileSync('src/screens/Rootwork.jsx', before + '\n' + newLayout + '\n' + after);
console.log('Rootwork restructured');
