const fs = require('fs');

let content = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');

// 1. Move and rename the Inscribe button
const buttonPattern = /<div style={{ position: 'absolute', right: 0, display: 'flex', gap: '0\.5rem', alignItems: 'center' }}>\s*<button className="btn plum" onClick={\(\) => \{\s*setAddForm\(.*?\}\);?\s*setModalState\('manual'\);\s*setManualStep\('seed'\);\s*setShowAddModal\(true\);\s*}}\>Inscribe<\/button>\s*<\/div>/g;

let buttonMatch = content.match(buttonPattern);
if (!buttonMatch) {
  console.log("Button not found!");
} else {
  // Extract the button onClick logic but change 'Inscribe' to 'Summon'
  let buttonCode = buttonMatch[0].replace('Inscribe</button>', 'Summon</button>');
  
  // Remove it from Apothecary
  content = content.replace(buttonMatch[0], '');
  
  // Insert it at the top of the page level
  const pageStart = `<div style={{padding: '1rem', maxWidth: '900px', margin: '0 auto'}}>`;
  const newHeader = `${pageStart}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        ${buttonCode}
      </div>`;
  content = content.replace(pageStart, newHeader);
}

// 2. Reorganize the grid
const gridStart = '<div className="tome-grid mt-4" style={{ width: \'100%\' }}>';
const gridEnd = '</div>\n\n\n      {showAddModal && (';

let gridBlock = content.substring(content.indexOf(gridStart), content.indexOf(gridEnd) + 6);

// Extract the 4 cards
// The Summoning Scroll
const scrollStart = gridBlock.indexOf('<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Summoning Scroll');
const scrollEnd = gridBlock.indexOf('</div>\n          </div>', scrollStart) + 24;
const cardScroll = gridBlock.substring(scrollStart, scrollEnd);

// The Waning
const waningStart = gridBlock.indexOf('<div className="card mb-4" style={{ marginBottom: 0, display: \'flex\', flexDirection: \'column\', maxHeight: \'500px\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Waning');
const waningEnd = gridBlock.indexOf('</div>\n          </div>', waningStart) + 24;
const cardWaning = gridBlock.substring(waningStart, waningEnd);

// The Silver Toll
const tollStart = gridBlock.indexOf('<div className="card mb-4" style={{ marginBottom: 0, alignSelf: \'start\', width: \'100%\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ textAlign: \'center\' }}>The Silver Toll');
const tollEnd = gridBlock.indexOf('</div>\n          </div>', tollStart) + 24;
const cardToll = gridBlock.substring(tollStart, tollEnd);

// The Echo
const echoStart = gridBlock.indexOf('<div className="card mb-4" style={{ marginBottom: 0, width: \'100%\' }}>\n            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>\n            <h3 style={{ justifyContent: \'center\' }}>The Echo');
const echoEnd = gridBlock.indexOf('</div>\n          </div>', echoStart) + 24;
const cardEcho = gridBlock.substring(echoStart, echoEnd);

// Assemble new grid
const newGrid = `${gridStart}
        <div className="tome-main-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          ${cardEcho}
          ${cardWaning}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          ${cardToll}
          ${cardScroll}
        </div>
      </div>`;

content = content.replace(gridBlock, newGrid);

fs.writeFileSync('src/screens/Rootwork.jsx', content);
console.log("Rootwork.jsx reorganized successfully.");
