const fs = require('fs');
let code = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8');

// Normalize line endings to make searching robust
code = code.replace(/\r\n/g, '\n');

const formStartMarker = '{alchemyForm ? (\n                <div style={{ textAlign: \'left\', marginTop: \'1rem\' }}>';
const formStartIndex = code.indexOf('{alchemyForm ? (');
if (formStartIndex === -1) {
  console.log('Cannot find formStartMarker');
  process.exit(1);
}

const elseBlockMarker = ') : (\n                <div style={{ marginTop: \'1rem\', display: \'flex\', flexDirection: \'column\'';
const elseBlockIndex = code.indexOf(elseBlockMarker);
if (elseBlockIndex === -1) {
  console.log('Cannot find elseBlockMarker');
  process.exit(1);
}

const formBlock = code.substring(formStartIndex + 16, elseBlockIndex);

let newCode = code.substring(0, formStartIndex);
newCode += code.substring(elseBlockIndex + 6); // Skip `) : (\n`

const ternaryEndMarker = 'Ignite New Alchemy</button>\n                    </div>\n                  </div>\n                )}';
const fixedEndMarker = 'Ignite New Alchemy</button>\n                    </div>\n                  </div>';
newCode = newCode.replace(ternaryEndMarker, fixedEndMarker);

const modalHtml = `
      {alchemyForm && (
        <div className="modal" style={{display: 'block'}}>
          <div className="modal-content card" style={{maxWidth: '400px'}}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{color: 'var(--plum)', textAlign: 'center'}}>Ignite New Alchemy</h3>
            ${formBlock.trim()}
          </div>
        </div>
      )}
`;

newCode = newCode.replace('{showDramModal && (', modalHtml + '\n      {showDramModal && (');

fs.writeFileSync('src/screens/ShadowTome.jsx', newCode);
console.log('Refactor complete.');
