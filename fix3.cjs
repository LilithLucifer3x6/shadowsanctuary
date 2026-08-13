const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

c = c.replace('<ConjureVisage onFinish={() => { ', '<ConjureVisage onCancel={localStorage.getItem(\'avatar_config\') ? () => setCurrentScreen(\'app\') : undefined} onFinish={() => { ');

const glossaryBtn = `<button onClick={() => {
                    alert('Glossary:\\nAppSpeak Translation Guide\\n\\nCrown = Hair\\nGaze = Eyes\\nGrin = Mouth/Teeth\\nVisage = Face\\nVessel = Body\\nSanctuary = App\\nReliquary = Tools/Devices\\nApothecary = Consumables', 'Glossary');
                  }} className="btn" style={{ width: '100%', marginBottom: '1rem', background: 'var(--card2)', borderColor: 'var(--plum)', color: 'var(--plum)' }}>Glossary of AppSpeak</button>`;

c = c.replace(glossaryBtn, '');
const scryingGlimpse = `1234567890
                    </div>
                  </div>`;
c = c.replace(scryingGlimpse, scryingGlimpse + '\n\n                  ' + glossaryBtn);

const s1 = `<button onClick={async () => {
                    if (await confirm("Leave the Sanctuary? You'll need to sign in again to return.")) {
                      await handleLogout();
                    }
                  }} className="btn" style={{ width: '100%', marginBottom: '1rem', background: 'var(--card2)', borderColor: 'var(--crimson)', color: 'var(--crimson)' }}>Leave the Sanctuary (Log Out)</button>`;
                  
const s2 = `<button onClick={() => {
                    setShowSettings(false);
                    setCurrentScreen('avatar');
                  }} className="btn plum" style={{ width: '100%', marginBottom: '1rem' }}>Reshape Visage (Avatar Builder)</button>`;

c = c.replace(s1, '');
c = c.replace(s2, '');

const neutralBlock = `
                <div>
                  ${s2}

                  ${s1.replace("marginBottom: '1rem'", "marginBottom: '0'")}
                </div>
`;

c = c.replace(`<h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--crimson)', textAlign: 'center' }}>Danger Zone</h3>`, neutralBlock + `<h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--crimson)', textAlign: 'center' }}>Danger Zone</h3>`);

const s3 = `<button onClick={() => saveSettings(settings)} className="btn full plum" style={{ marginTop: '2rem', padding: '1rem', fontSize: '1.2rem' }}>Bind the Runes of Power</button>`;
c = c.replace(s3, '');

const targetEnd = `              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}`;

c = c.replace(targetEnd, `              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', width: '100%' }}>
                ${s3.replace("marginTop: '2rem'", "marginTop: '0'")}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}`);

const eVoice = `<div className="field" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', }}>
                    <input type="checkbox" checked={settings.tts} `;

c = c.replace(eVoice, `<div className="field" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', }}>
                      <input type="checkbox" checked={settings.tts} `);

c = c.replace(`{settings.tts && (
                    <div style={{ display: 'flex', marginTop: '0.5rem', flexDirection: 'column', gap: '0.5rem' }}>`, `{settings.tts && (
                      <div style={{ display: 'flex', marginLeft: '1.5rem', marginTop: '0.5rem', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>`);

c = c.replace(`                <div className="field" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    <label className="settings-toggle">`, `                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', }}>`);

c = c.replace(`<label style={{ color: 'var(--crimson)', marginTop: '1rem' }}>`, `<label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--crimson)' }}>`);

c = c.replace(`<button className="btn sm g" onClick={() => requestCalendarAccess()} style={{ width: 'fit-content' }}>Bind Solar Almanac</button>`, `<div style={{ display: 'flex', justifyContent: 'center' }}><button className="btn sm g" onClick={() => requestCalendarAccess()} style={{ width: 'fit-content' }}>Bind Solar Almanac</button></div>`);

c = c.replace(`                  </div>
                </div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--crimson)', textAlign: 'center' }}>Danger Zone</h3>`, `                  </div>
                </div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--crimson)', textAlign: 'center' }}>Danger Zone</h3>`);

fs.writeFileSync('src/App.jsx', c);
console.log('Done');
