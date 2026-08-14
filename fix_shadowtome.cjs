const fs = require('fs');
let code = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8');

// 1. Remove the mangled Harvest & Alchemist's Scale section completely
code = code.replace(/<h3 style={{ fontSize: '1\.2rem', textAlign: 'center' }}>The Alchemist's Scale<\/h3>[\s\S]*?Consecrate New Dram\s*<\/button>\s*<\/div>\s*<\/div>/, '');

// 2. Extract The Stillroom
const stillroomMatch = code.match(/<div>\s*<h3 style={{ fontSize: '1\.5rem', textAlign: 'center' }}>The Stillroom<\/h3>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
let stillroomCode = '';
if (stillroomMatch) {
  stillroomCode = stillroomMatch[0];
  // Remove the old Stillroom card structure wrapper since we're deleting Row 4
  code = code.replace(/\{\/\* Row 4: The Stillroom & Harvest \*\/\}\s*<div className="card"[^>]*>[\s\S]*?(?=\{\/\* Tea Scanner Modal \*\/\})/, '');
}

// 3. Move Alchemist's Scale into Alchemies
const alchemiesBlock = `
                <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', textAlign: 'center', margin: '0 0 1rem 0' }}>The Alchemist's Scale</h3>
                  <button className="btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} onClick={() => setShowDramModal(true)}>
                    <Icon name="plus" /> Consecrate New Dram
                  </button>
                </div>
              </div>
          </div>
`;
code = code.replace(/<button className="btn plum" onClick=\{startNewAlchemy\}>Ignite New Alchemy<\/button>\s*<\/div>\s*<\/div>\s*<\/div>/, `<button className="btn plum" onClick={startNewAlchemy}>Ignite New Alchemy</button>\n                </div>${alchemiesBlock}`);

// 4. Insert Stillroom directly below Herbarium
const newStillroomCard = `

          {/* Row 2.5: The Stillroom */}
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <div>
              <h3 style={{ fontSize: '1.5rem', textAlign: 'center' }}>The Stillroom</h3>
              <div style={{ color: 'var(--dim)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>Raw botanicals and carrier oils.</div>
              {stillroomItems.length === 0 ? (
                <div className="empty" style={{ padding: '1rem' }}>The stillroom is bare.</div>
              ) : (
                <div className="rites2">
                  {stillroomItems.map(item => (
                    <div key={item.id} className="act" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--plum)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem' }}>{item.brand} • {item.category}</div>
                      </div>
                      <div style={{ color: 'var(--gold)' }}>{item.weight ? \`\${item.weight}g\` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>`;

code = code.replace(/<\/div>\s*\{\/\* Row 3: Alchemies \*\/\}/, `</div>${newStillroomCard}\n\n          {/* Row 3: Alchemies */}`);

fs.writeFileSync('src/screens/ShadowTome.jsx', code);
console.log('Fixed ShadowTome.jsx');
