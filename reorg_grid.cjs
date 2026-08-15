const fs = require('fs');
let content = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');

// Find the start of the tome-grid
const gridStartIdx = content.indexOf('<div className="tome-grid mt-4"');
const gridEndIdx = content.indexOf('{showAddModal && (');

if (gridStartIdx === -1 || gridEndIdx === -1) {
  console.log("Could not find grid bounds!");
  process.exit(1);
}

// Find the start and end of each card inside this section
function findCard(headerText) {
  const headerIdx = content.indexOf(headerText, gridStartIdx);
  if (headerIdx === -1) return null;
  
  // Find the <div className="card mb-4"...> before this header
  let searchIdx = headerIdx;
  let cardStart = -1;
  while (searchIdx > gridStartIdx) {
    const p = content.lastIndexOf('<div className="card mb-4"', searchIdx);
    if (p !== -1) {
      cardStart = p;
      break;
    }
    searchIdx--;
  }
  
  if (cardStart === -1) return null;
  
  // Find the end of this card. Assuming it ends at the next card start, or at the end of the column.
  // Actually, we can count divs or just find the closing </div>\n        </div>.
  // Since we know the order, let's just use string boundaries based on the next card.
  return cardStart;
}

const scrollIdx = findCard('The Summoning Scroll');
const waningIdx = findCard('The Waning');
const tollIdx = findCard('The Silver Toll');
const echoIdx = findCard('The Echo');

const cards = [
  { name: 'scroll', start: scrollIdx },
  { name: 'waning', start: waningIdx },
  { name: 'toll', start: tollIdx },
  { name: 'echo', start: echoIdx }
].sort((a,b) => a.start - b.start);

// The end of a card is either the start of the next card, or the end of its column.
for (let i = 0; i < cards.length; i++) {
  if (i < cards.length - 1) {
    cards[i].end = cards[i+1].start;
    // But wait, there might be column closing tags between cards!
    // The previous card might end right before `</div>\n\n          <div className="card mb-4"`
    // Actually, let's just parse the full string.
  }
}

// Let's just use regex to match each card.
const getCardBlock = (str) => {
  const start = content.indexOf(`<h3`, content.indexOf(str) - 200);
  const cardStart = content.lastIndexOf(`<div className="card mb-4"`, start);
  
  // count divs
  let open = 0;
  let idx = cardStart;
  while (idx < content.length) {
    if (content.substr(idx, 4) === '<div') open++;
    else if (content.substr(idx, 5) === '</div') {
      open--;
      if (open === 0) return content.substring(cardStart, idx + 6);
    }
    idx++;
  }
  return "";
};

const scrollCard = getCardBlock('The Summoning Scroll');
const waningCard = getCardBlock('The Waning');
const tollCard = getCardBlock('The Silver Toll');
const echoCard = getCardBlock('The Echo');

// Now replace the whole tome-grid
const newGrid = `<div className="tome-grid mt-4" style={{ width: '100%' }}>
        <div className="tome-main-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          ${echoCard}
          ${waningCard}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          ${tollCard}
          ${scrollCard}
        </div>
      </div>
`;

// Replace from gridStartIdx to the closing tags before {showAddModal}
const endDivsIdx = content.lastIndexOf('</div>', gridEndIdx);
const priorEndDivsIdx = content.lastIndexOf('</div>', endDivsIdx - 1);
const beforeModal = content.lastIndexOf('</div>', priorEndDivsIdx - 1) + 6;

const originalGridBlock = content.substring(gridStartIdx, beforeModal);

content = content.replace(originalGridBlock, newGrid + '\n\n\n');

fs.writeFileSync('src/screens/Rootwork.jsx', content);
console.log("Rootwork.jsx grid reorganized successfully.");
