const fs = require('fs');
let content = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');

const tollStart = '<div className="card mb-4" style={{ marginBottom: 0, alignSelf: \'start\', width: \'100%\' }}>';
const echoStart = '<div className="card mb-4" style={{ marginBottom: 0, width: \'100%\' }}>';
const ritesStart = '<div className="rites2 mt-4" style={{ width: \'100%\' }}>';
const waningStart = '<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n          <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n          <h3 style={{ justifyContent: \'center\' }}>The Waning';
const summonStart = '<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n          <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n          <h3 style={{ justifyContent: \'center\' }}>The Summoning Scroll';
const ritesEnd = '</div>\n        </div>\n\n      </div>'; // This closes summon, rites2 wrapper, etc. Wait, it's safer to just find showAddModal
const allEnd = '{showAddModal && (';
const tomeGridStart = '<div className="tome-grid mt-4" style={{ width: \'100%\' }}>';

const iTomeGrid = content.indexOf(tomeGridStart);
const iToll = content.indexOf(tollStart);
const iEcho = content.indexOf(echoStart);
const iRites = content.indexOf(ritesStart);
const iWaning = content.indexOf(waningStart);
const iSummon = content.indexOf(summonStart);
const iAllEnd = content.indexOf(allEnd);

const beforeGrid = content.substring(0, iTomeGrid);
const tollBlock = content.substring(iToll, iEcho);

// Echo ends exactly where rites starts
const echoBlock = content.substring(iEcho, iRites);
// Wait, echo is inside tome-grid, and the closing </div> for tome-grid is right before rites2.
// Let's trim off the closing div from echoBlock
let trimmedEcho = echoBlock.trim();
if (trimmedEcho.endsWith('</div>\n      </div>')) {
   trimmedEcho = trimmedEcho.substring(0, trimmedEcho.length - 13);
} else if (trimmedEcho.endsWith('</div>')) {
   trimmedEcho = trimmedEcho.substring(0, trimmedEcho.length - 6);
}

const waningBlock = content.substring(iWaning, iSummon);

const summonToModal = content.substring(iSummon, iAllEnd);
// summon block ends with </div> </div> </div> which closes summon, rites, and the top level.
// We just want the summon card!
let trimmedSummon = summonToModal.trim();
// The summon card ends with </div> </div>. Let's just find the last </div> before we see the three closing divs.
// Actually, summonToModal has:
//           </div>
//         </div>
//       </div>
// 
// {showAddModal
const summonEndIdx = trimmedSummon.lastIndexOf('</div>\n        </div>\n\n      </div>');
if (summonEndIdx !== -1) {
  trimmedSummon = trimmedSummon.substring(0, summonEndIdx + 14); // keep </div>\n        </div>
}

const newLayout = `      <div className="tome-grid mt-4" style={{ width: '100%' }}>
        <div className="tome-main-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          \${trimmedSummon.trim()}
          \${waningBlock.trim()}
          \${tollBlock.trim()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          \${trimmedEcho.trim()}
        </div>
      </div>

      `;

const newContent = beforeGrid + newLayout + content.substring(iAllEnd);
fs.writeFileSync('src/screens/Rootwork.jsx', newContent);
console.log('done layout fix with indexOf');
