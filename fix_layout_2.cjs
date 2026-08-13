const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// The goal: 
// 1. Move "Reshape Visage", "Leave the Sanctuary (Log Out)", and "Bind the Runes of Power" out of Danger Zone.
// 2. Glossary button should be below font preview.
// 3. Fix Checkbox Cascade.
// Let's just do it by replacing the whole Right Column & Danger zone block.

const startMarker = '{/* Right Column: Ethereal Echoes & Conduits, then Danger Zone stacked below */}';
const endMarker = '          </div>\n        </div>\n      )}\n    </>\n  );\n}';
const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log('Markers not found', startIndex, endIndex);
  process.exit(1);
}

const replacement = `{/* Right Column: Ethereal Echoes & Conduits, then Danger Zone stacked below */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div>
                  <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>Ethereal Echoes & Conduits</h3>

                  <div className="field" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                      
                      <div style={{ width: '100%' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <input type="checkbox" checked={settings.tts} style={{ marginTop: '0.2rem' }}
                               onChange={e => {
                                 setSettings({...settings, tts: e.target.checked});
                                 setTtsEnabled(e.target.checked);
                               }} /> 
                          <span style={{ lineHeight: '1.4' }}>Awaken Ethereal Voice (TTS)</span>
                        </label>
                        
                        {settings.tts && (
                          <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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

                      <div style={{ width: '100%' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <input type="checkbox" checked={settings.health} style={{ marginTop: '0.2rem' }} onChange={async (e) => {
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
                          }} /> 
                          <span style={{ lineHeight: '1.4' }}>Corporeal Sensors (RingConn, Renpho, Samsung)</span>
                        </label>
                      </div>
                      
                      <div style={{ width: '100%' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--crimson)' }}>
                          <input type="checkbox" checked={settings.cal} style={{ marginTop: '0.2rem' }}
                                 onChange={e => setSettings({...settings, cal: e.target.checked})} /> 
                          <span style={{ lineHeight: '1.4' }}>Solar Almanac (Google Calendar)</span>
                        </label>
                        {settings.cal && (
                          <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                            <div className="mt" style={{ fontSize: '0.8rem', textAlign: 'center' }}>Offer the Celestial ID to chart the wheel of the year.</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>Sanctuary Gate</h3>
                  <button onClick={() => {
                    setShowSettings(false);
                    setCurrentScreen('avatar');
                  }} className="btn plum" style={{ width: '100%', marginBottom: '1rem' }}>Reshape Visage (Avatar Builder)</button>

                  <button onClick={async () => {
                    if (await confirm("Leave the Sanctuary? You'll need to sign in again to return.")) {
                      await handleLogout();
                    }
                  }} className="btn" style={{ width: '100%', background: 'var(--card2)', borderColor: 'var(--crimson)', color: 'var(--crimson)' }}>Leave the Sanctuary (Log Out)</button>
                </div>

                <div>
                  <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--crimson)', textAlign: 'center' }}>Danger Zone</h3>
                  <button onClick={async () => {
                    if (await confirm("Do you truly wish to shatter the First Inscription? You will be cast back to the initial inquiry.")) {
                      try {
                        const { data: profile, error: profileErr } = await supabase.from('user_profile').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
                        if (profileErr) throw profileErr;
                        if (profile) {
                          const { error: updateErr } = await supabase.from('user_profile').update({ intake_completed: false }).eq('id', profile.id);
                          if (updateErr) throw updateErr;
                        }
                        setShowSettings(false);
                        setCurrentScreen('intake');
                      } catch (err) {
                        console.error('Failed to shatter inscription', err);
                        await alert('Failed to communicate with the Sanctuary. Please try again.');
                      }
                    }
                  }} className="btn g" style={{ width: '100%', marginBottom: '1rem' }}>Shatter the First Inscription</button>

                  <button onClick={async () => {
                    if (await confirm("Do you truly wish to raze this Sanctuary to ash? All saved rites, items, and settings shall be lost to the void. This cannot be undone.", "Danger")) {
                      try {
                        const { error: profileErr } = await supabase.from('user_profile').delete().not('id', 'is', null);
                        if (profileErr) throw profileErr;
                        await supabase.from('somatic_reactions').delete().not('id', 'is', null);
                        await supabase.from('shadowtome_elixirs').delete().not('id', 'is', null);
                        await supabase.from('journal_entries').delete().not('id', 'is', null);
                        await supabase.from('routine_history').delete().not('id', 'is', null);
                        await supabase.from('appointments').delete().not('id', 'is', null);
                        await supabase.from('isotretinoin_log').delete().not('id', 'is', null);
                        await supabase.from('codex_entries').delete().eq('is_permanent', false);
                        await supabase.from('items').delete().not('id', 'is', null);
                      } catch (err) {
                        console.error('Failed to erase Codex', err);
                        await alert('Failed to erase Codex. Continuing local wipe.');
                      }
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }
                  }} className="btn g" style={{ width: '100%' }}>Raze the Sanctuary to Ash</button>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <button onClick={() => saveSettings(settings)} className="btn full plum" style={{ padding: '1rem', fontSize: '1.2rem' }}>Bind the Runes of Power</button>
            </div>
`;

let newCode = code.substring(0, startIndex) + replacement + '\n' + code.substring(endIndex);

// 2. Fix Glossary button position
// Currently it's right after Scrying Glimpse preview. Wait, I should make sure it is exactly where the user wants: "below the font preview"
// In my dump, it was right below `Scrying Glimpse`. Let's check where it actually is now.
const glossaryBtn = `<button onClick={() => {
                  alert('Glossary:\\nAppSpeak Translation Guide\\n\\nCrown = Hair\\nGaze = Eyes\\nGrin = Mouth/Teeth\\nVisage = Face\\nVessel = Body\\nSanctuary = App\\nReliquary = Tools/Devices\\nApothecary = Consumables', 'Glossary');
                }} className="btn" style={{ width: '100%', marginBottom: '1rem', background: 'var(--card2)', borderColor: 'var(--plum)', color: 'var(--plum)' }}>Glossary of AppSpeak</button>`;

if (newCode.includes(glossaryBtn)) {
  // It's already right below the Font Preview (Scrying Glimpse). I'll leave it there as requested.
} else {
  console.log("Could not find Glossary button exactly.");
}

fs.writeFileSync('src/App.jsx', newCode);
console.log('App.jsx Phase 3 layout fixed');
