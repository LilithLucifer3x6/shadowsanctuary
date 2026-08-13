const fs = require('fs');
const content = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');

const tollStart = content.indexOf('<div className="card mb-4" style={{ marginBottom: 0, alignSelf: \'start\', width: \'100%\' }}>');
const echoStart = content.indexOf('<div className="card mb-4" style={{ marginBottom: 0, width: \'100%\' }}>');
const waningStart = content.indexOf('<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n          <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n          <h3 style={{ justifyContent: \'center\' }}>The Waning');
const summonStart = content.indexOf('<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n          <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n          <h3 style={{ justifyContent: \'center\' }}>The Summoning Scroll');
const afterSummon = content.indexOf('</div>\n        </div>\n      </div>\n\n      {showAddModal');
const tomeGridStart = content.indexOf('<div className="tome-grid mt-4" style={{ width: \'100%\' }}>');
const beforeTomeGrid = content.slice(0, tomeGridStart + 58);

const tollBlock = content.slice(tollStart, echoStart);
const echoBlockFull = content.slice(echoStart, waningStart);
const echoEnd = echoBlockFull.lastIndexOf('</div>\n        </div>');
const echoBlock = echoBlockFull.slice(0, echoEnd + 6); // Extract echo card

const waningBlock = content.slice(waningStart, summonStart);
const summonBlock = content.slice(summonStart, afterSummon + 14);

const newLayout = `
        <div className="tome-main-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
${summonBlock}
${waningBlock}
${tollBlock}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
${echoBlock}
        </div>
      </div>
`;

const afterBlock = content.slice(afterSummon + 14);

fs.writeFileSync('src/screens/Rootwork.jsx', beforeTomeGrid + '\n' + newLayout + '\n' + afterBlock);
console.log('done');
