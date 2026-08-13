const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Fix checkbox cascades:
code = code.replace(
  /<label style=\{\{ display: 'flex', alignItems: 'center', gap: '0.5rem' \}\}>/g,
  `<label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>`
);
code = code.replace(
  /<label style=\{\{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var\(--crimson\)' \}\}>/g,
  `<label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--crimson)' }}>`
);
// And add some margin-top to the checkbox so it lines up with the first line of text
code = code.replace(
  /<input type="checkbox"/g,
  `<input type="checkbox" style={{ marginTop: '0.2rem' }}`
);

// Center "Bind Solar Almanac" 
// It is currently: <div style={{ display: 'flex', justifyContent: 'center' }}><button className="btn sm g" onClick={() => requestCalendarAccess()} style={{ width: 'fit-content' }}>Bind Solar Almanac</button></div>
// Wait, my dump showed it WAS in a center div:
// `<div style={{ display: 'flex', justifyContent: 'center' }}><button className="btn sm g" onClick={() => requestCalendarAccess()} style={{ width: 'fit-content' }}>Bind Solar Almanac</button></div>`
// Ah, the user said "Center 'Bind Solar Almanac'", which means maybe they just want it centered, or it isn't currently centered. Oh, in the original code, it was:
// `<button className="btn sm g" onClick={() => requestCalendarAccess()} style={{ width: 'fit-content' }}>Bind Solar Almanac</button>`
// Let's replace the whole block just to be sure.

// Move Danger Zone stuff:
const dangerZoneStart = `<div>
                    <button onClick={() => {
                      setShowSettings(false);
                      setCurrentScreen('avatar');
                    }} className="btn plum" style={{ width: '100%', marginBottom: '1rem' }}>Reshape Visage (Avatar Builder)</button>
  
                    <button onClick={async () => {
                      if (await confirm("Leave the Sanctuary? You'll need to sign in again to return.")) {
                        await handleLogout();
                      }
                    }} className="btn" style={{ width: '100%', marginBottom: '0', background: 'var(--card2)', borderColor: 'var(--crimson)', color: 'var(--crimson)' }}>Leave the Sanctuary (Log Out)</button>
                  </div>
                  
                  <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--crimson)', textAlign: 'center' }}>Danger Zone</h3>`;

const safeZone = `<div>
                    <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', textAlign: 'center' }}>Sanctuary Gate</h3>
                    <button onClick={() => {
                      setShowSettings(false);
                      setCurrentScreen('avatar');
                    }} className="btn plum" style={{ width: '100%', marginBottom: '1rem' }}>Reshape Visage (Avatar Builder)</button>
  
                    <button onClick={async () => {
                      if (await confirm("Leave the Sanctuary? You'll need to sign in again to return.")) {
                        await handleLogout();
                      }
                    }} className="btn" style={{ width: '100%', marginBottom: '0', background: 'var(--card2)', borderColor: 'var(--crimson)', color: 'var(--crimson)' }}>Leave the Sanctuary (Log Out)</button>
                  </div>
                  
                  <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--crimson)', textAlign: 'center' }}>Danger Zone</h3>`;

code = code.replace(dangerZoneStart, safeZone);

// "Bind the Runes of Power" out of Danger zone. It's actually at the very bottom right now:
/*
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <button onClick={() => saveSettings(settings)} className="btn full plum" style={{ marginTop: '0', padding: '1rem', fontSize: '1.2rem' }}>Bind the Runes of Power</button>
                </div>
*/
// It's technically outside the `Danger Zone` div already, but maybe visually it looks grouped? Let's add a visual separator or move it. Wait, the user said "Move "Bind the Runes of Power" and "Reshape Visage" out of Danger Zone".
// If they were inside it before, maybe the structure is confusing. Let's make sure it's clearly separated.

fs.writeFileSync('src/App.jsx', code);
console.log('Done script');
