const fs = require('fs');

let code = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8');

// The block to replace:
const startMarker = "        {/* Right Column: Widgets */}";
const endMarker = "          {/* Breathwork moved above */}";

const startIndex = code.indexOf(startMarker);
let endIndex = code.indexOf(endMarker) + endMarker.length;
const restOfFile = code.substring(endIndex);
const closingDivIdx = restOfFile.indexOf('</div>');
endIndex += closingDivIdx + 6;

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end marker");
    process.exit(1);
}

const targetBlock = code.substring(startIndex, endIndex);

const getCard = (order) => {
    const q = String.fromCharCode(39);
    const searchString = '<div className="card" style={{ padding: ' + q + '1.5rem' + q + ', textAlign: ' + q + 'center' + q + ', order: ' + order + ' }}>';
    const replaceString = '<div className="card" style={{ padding: ' + q + '1.5rem' + q + ', textAlign: ' + q + 'center' + q + ' }}>';
    
    const startIdx = targetBlock.indexOf(searchString);
    if (startIdx === -1) {
        console.error("Could not find card " + order);
        return null;
    }
    
    let count = 0;
    let idx = startIdx;
    
    while (idx < targetBlock.length) {
        const nextDiv = targetBlock.indexOf('<div', idx);
        const nextCloseDiv = targetBlock.indexOf('</div', idx);
        
        if (nextCloseDiv === -1) break;
        
        if (nextDiv !== -1 && nextDiv < nextCloseDiv) {
            count++;
            idx = nextDiv + 4;
        } else {
            count--;
            idx = nextCloseDiv + 6;
            if (count === 0) {
                let cardHTML = targetBlock.substring(startIdx, idx);
                cardHTML = cardHTML.replace(searchString, replaceString);
                return cardHTML;
            }
        }
    }
    return null;
};

const breathCard = getCard(1); // Breath
const vaporsCard = getCard(2); // Vapors
const elixirsCard = getCard(3); // Elixirs
const troveCard = getCard(4); // Trove

if (!breathCard || !vaporsCard || !elixirsCard || !troveCard) {
    console.error("Could not extract all cards!");
    process.exit(1);
}

const newLayout = "        {/* Right Column: Widgets */}\n" +
"        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>\n" +
"          \n" +
"          {/* Row 1: Herbal Elixirs */}\n" +
elixirsCard + "\n\n" +
"          {/* Row 2: Botanical Trove */}\n" +
troveCard + "\n\n" +
"          {/* Row 3: Ethereal Vapors and Breath (Side by Side) */}\n" +
"          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>\n" +
"  " + vaporsCard.split('\n').join('\n  ') + "\n\n" +
"  " + breathCard.split('\n').join('\n  ') + "\n" +
"          </div>\n\n" +
"        </div>";

const newCode = code.substring(0, startIndex) + newLayout + code.substring(endIndex);

fs.writeFileSync('src/screens/ShadowTome.jsx.new', newCode);
console.log("Successfully generated src/screens/ShadowTome.jsx.new");
