const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 4. Add onCancel to ConjureVisage
content = content.replace(
  '<ConjureVisage onFinish={() => { ',
  '<ConjureVisage onCancel={localStorage.getItem(\'avatar_config\') ? () => setCurrentScreen(\'app\') : undefined} onFinish={() => { '
);

// 2. Glossary move
const gStart = content.indexOf('<button onClick={() => {\n                    alert(\'Glossary:\\nAppSpeak Translation Guide');
const gEnd = content.indexOf('Glossary of AppSpeak</button>', gStart) + 'Glossary of AppSpeak</button>'.length;
const gStr = content.substring(gStart, gEnd);
content = content.replace(gStr, '');
const target = '1234567890\n                    </div>\n                  </div>';
content = content.replace(target, target + '\n                  \n                  ' + gStr);

// 3. Danger Zone move
const s1 = `<button onClick={async () => {
                    if (await confirm("Leave the Sanctuary? You'll need to sign in again to return.")) {
                      await handleLogout();
                    }
                  }} className="btn" style={{ width: '100%', marginBottom: '1rem', background: 'var(--card2)', borderColor: 'var(--crimson)', color: 'var(--crimson)' }}>Leave the Sanctuary (Log Out)</button>`;
                  
const s2 = `<button onClick={() => {
                    setShowSettings(false);
                    setCurrentScreen('avatar');
                  }} className="btn plum" style={{ width: '100%', marginBottom: '1rem' }}>Reshape Visage (Avatar Builder)</button>`;

const s3 = `<button onClick={() => saveSettings(settings)} className="btn full plum" style={{ marginTop: '2rem', padding: '1rem', fontSize: '1.2rem' }}>Bind the Runes of Power</button>`;

content = content.replace(s1, '');
content = content.replace(s2, '');

const neutralBlock = `\n                <div>\n                  ${s2}\n\n                  ${s1.replace('marginBottom: \'1rem\'', 'marginBottom: \'0\'')}\n                </div>\n`;

content = content.replace(`<h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--crimson)', textAlign: 'center' }}>Danger Zone</h3>`, neutralBlock + `\n                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--crimson)', textAlign: 'center' }}>Danger Zone</h3>`);

// Move s3
content = content.replace(s3, '');
// I will place s3 at the very end of the modal content
const endGridTarget = `              </div>\n            </div>\n          </div>\n        </div>\n      )}\n    </>\n  );\n}`;
content = content.replace(endGridTarget, `              </div>\n              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', width: '100%' }}>\n                ${s3.replace('marginTop: \'2rem\'', 'marginTop: \'0\'')}\n              </div>\n            </div>\n          </div>\n        </div>\n      )}\n    </>\n  );\n}`);


// 1. Checkboxes layout fix
const oldCheckboxSection = `                <div className="field" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', }}>
                    <input type="checkbox" checked={settings.tts} 
                         onChange={e => {
                           setSettings({...settings, tts: e.target.checked});
                           setTtsEnabled(e.target.checked);
                         }} /> Awaken Ethereal Voice
                  </label>
                  
                  {settings.tts && (
                    <div style={{ display: 'flex', marginTop: '0.5rem', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.8rem' }}>Incantation Voice
                        <select style={{ width: '100%', marginTop: '0.2rem' }}
                                value={ttsOptions.voice}
                                onChange={e => {
                                  setTtsOptions({...ttsOptions, voice: e.target.value});
                                  setTtsVoiceURI(e.target.value);
                                }}>
                          {availableVoices.map(v => (
                            <option key={v.voiceURI} value={v.voiceURI}>{v.displayName}</option>
                          ))}
                        </select>
                      </label>
                      <label style={{ fontSize: '0.8rem' }}>Tempo of Speech
                        <input type="range" min="0.5" max="2.0" step="0.1" style={{ width: '100%' }}
                               value={ttsOptions.rate}
                               onChange={e => {
                                 const v = parseFloat(e.target.value);
                                 setTtsOptions({...ttsOptions, rate: v});
                                 setTtsRate(v);
                               }} />
                      </label>
                      <label style={{ fontSize: '0.8rem' }}>Vocal Resonance
                        <input type="range" min="0.5" max="2.0" step="0.1" style={{ width: '100%' }}
                               value={ttsOptions.pitch}
                               onChange={e => {
                                 const v = parseFloat(e.target.value);
                                 setTtsOptions({...ttsOptions, pitch: v});
                                 setTtsPitch(v);
                               }} />
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="field" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    <label className="settings-toggle">
                      <input type="checkbox" checked={settings.health} onChange={async (e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          const { requestHealthPermissions, syncWearableSnapshot } = await import('./lib/health-connect.js');
                          const granted = await requestHealthPermissions();
                          if (granted) {
                            setSettings({...settings, health: true});
                            syncWearableSnapshot();
                          }
                        } else {
                          setSettings({...settings, health: checked});
                        }
                      }} /> Corporeal Sensors (RingConn, Renpho, Samsung)
                    </label>
                    
                    <label style={{ color: 'var(--crimson)', marginTop: '1rem' }}>
                      <input type="checkbox" checked={settings.cal}
                             onChange={e => setSettings({...settings, cal: e.target.checked})} /> Solar Almanac (Google Calendar)
                    </label>
                    {settings.cal && (
                      <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input type="text" placeholder="Google OAuth Client ID" value={settings.gcalClientId || ''} 
                               onChange={e => {
                                 setSettings({...settings, gcalClientId: e.target.value});
                                 if (e.target.value) {
                                   initGoogleCalendar(e.target.value, () => alert("The Solar Almanac is Bound!"));
                                 }
                               }} style={{ padding: '0.5rem', width: '100%' }} />
                        <button className="btn sm g" onClick={() => requestCalendarAccess()} style={{ width: 'fit-content' }}>Bind Solar Almanac</button>
                        <div className="mt" style={{ fontSize: '0.8rem' }}>Offer the Celestial ID to chart the wheel of the year.</div>
                      </div>
                    )}
                  </div>
                </div>`;

const newCheckboxSection = `                <div className="field" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" checked={settings.tts} 
                           onChange={e => {
                             setSettings({...settings, tts: e.target.checked});
                             setTtsEnabled(e.target.checked);
                           }} /> Awaken Ethereal Voice
                    </label>
                    
                    {settings.tts && (
                      <div style={{ display: 'flex', marginLeft: '1.5rem', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                        <label style={{ fontSize: '0.8rem' }}>Incantation Voice
                          <select style={{ width: '100%', marginTop: '0.2rem' }}
                                  value={ttsOptions.voice}
                                  onChange={e => {
                                    setTtsOptions({...ttsOptions, voice: e.target.value});
                                    setTtsVoiceURI(e.target.value);
                                  }}>
                            {availableVoices.map(v => (
                              <option key={v.voiceURI} value={v.voiceURI}>{v.displayName}</option>
                            ))}
                          </select>
                        </label>
                        <label style={{ fontSize: '0.8rem' }}>Tempo of Speech
                          <input type="range" min="0.5" max="2.0" step="0.1" style={{ width: '100%' }}
                                 value={ttsOptions.rate}
                                 onChange={e => {
                                   const v = parseFloat(e.target.value);
                                   setTtsOptions({...ttsOptions, rate: v});
                                   setTtsRate(v);
                                 }} />
                        </label>
                        <label style={{ fontSize: '0.8rem' }}>Vocal Resonance
                          <input type="range" min="0.5" max="2.0" step="0.1" style={{ width: '100%' }}
                                 value={ttsOptions.pitch}
                                 onChange={e => {
                                   const v = parseFloat(e.target.value);
                                   setTtsOptions({...ttsOptions, pitch: v});
                                   setTtsPitch(v);
                                 }} />
                        </label>
                      </div>
                    )}

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" checked={settings.health} onChange={async (e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          const { requestHealthPermissions, syncWearableSnapshot } = await import('./lib/health-connect.js');
                          const granted = await requestHealthPermissions();
                          if (granted) {
                            setSettings({...settings, health: true});
                            syncWearableSnapshot();
                          }
                        } else {
                          setSettings({...settings, health: checked});
                        }
                      }} /> Corporeal Sensors (RingConn, Renpho, Samsung)
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--crimson)' }}>
                      <input type="checkbox" checked={settings.cal}
                             onChange={e => setSettings({...settings, cal: e.target.checked})} /> Solar Almanac (Google Calendar)
                    </label>
                    {settings.cal && (
                      <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                        <input type="text" placeholder="Google OAuth Client ID" value={settings.gcalClientId || ''} 
                               onChange={e => {
                                 setSettings({...settings, gcalClientId: e.target.value});
                                 if (e.target.value) {
                                   initGoogleCalendar(e.target.value, () => alert("The Solar Almanac is Bound!"));
                                 }
                               }} style={{ padding: '0.5rem', width: '100%' }} />
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button className="btn sm g" onClick={() => requestCalendarAccess()} style={{ width: 'fit-content' }}>Bind Solar Almanac</button>
                        </div>
                        <div className="mt" style={{ fontSize: '0.8rem' }}>Offer the Celestial ID to chart the wheel of the year.</div>
                      </div>
                    )}
                  </div>
                </div>`;

content = content.replace(oldCheckboxSection, newCheckboxSection);

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx changes applied.');
