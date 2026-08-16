const fs = require('fs');

let intake = fs.readFileSync('src/screens/Intake.jsx', 'utf8');

// Update UI Terminology for Topicals
intake = intake.replace(/Sacred Healing Directives \(Topical Decrees\)/g, 'Medical Directives (Topical)');
intake = intake.replace(/Summon Topical Prescription/g, 'Summon Topical Measure');
intake = intake.replace(/I am burdened by no topical prescriptions\./g, 'I hold no topical measures.');

// OralList string array to object array
// 1. Initial State
intake = intake.replace(/setOralList\(\[...oralList, ''\]\);/g, "setOralList([...oralList, { name: '', type: 'prescription' }]);");
// 2. Filter logic
intake = intake.replace(/const filteredOralList = noOral \? \[\] : oralList\.filter\(o => o && o\.trim\(\) !== ''\);/g, "const filteredOralList = noOral ? [] : oralList.filter(o => o && o.name && o.name.trim() !== '');");
// 3. Step 9 Validation
intake = intake.replace(/if \(currentStep === 9\) return noOral \|\| oralList\.some\(o => o\.trim\(\) !== ''\);/g, "if (currentStep === 9) return noOral || oralList.some(o => o.name && o.name.trim() !== '');");
// 4. updateOral function signature
intake = intake.replace(/const updateOral = \(index, value\) => \{/g, "const updateOral = (index, field, value) => {");
intake = intake.replace(/newList\[index\] = value;/g, "newList[index][field] = value;");
// 5. isotretinoin check (accutane check)
intake = intake.replace(/ans\.oralList\.some\(m => m\.toLowerCase\(\)\.includes/g, "ans.oralList.some(m => m.name && m.name.toLowerCase().includes");
intake = intake.replace(/m\.toLowerCase\(\)\.includes\('accutane'\)/g, "m.name && m.name.toLowerCase().includes('accutane')");
intake = intake.replace(/oralList\.some\(m => m\.toLowerCase\(\)\.includes/g, "oralList.some(m => m.name && m.name.toLowerCase().includes");

// 6. Mapping rendering
const oldOralRender = `{oralList.map((med, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <VoiceInput value={med} onChange={e => updateOral(i, e.target.value)} placeholder="" />
                      </div>
                      <button className="btn sm" style={{ background: 'transparent', color: 'var(--plum)', padding: '0.5rem' }} onClick={() => removeOral(i)}>Shatter</button>
                    </div>
                  ))}`;

const newOralRender = `{oralList.map((med, i) => (
                    <div key={i} style={{ borderLeft: '2px solid var(--gold)', paddingLeft: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--plum)' }}>Systemic {i + 1}</span>
                        <button className="btn sm" style={{ background: 'transparent', color: 'var(--plum)', padding: 0 }} onClick={() => removeOral(i)}>Shatter</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="field">
                          <label style={{ color: 'var(--silver)', fontSize: '0.9rem', marginBottom: '0.3rem', display: 'block' }}>Name</label>
                          <VoiceInput value={med.name} onChange={e => updateOral(i, 'name', e.target.value)} placeholder="" />
                        </div>
                        <div className="field">
                          <label style={{ color: 'var(--silver)', fontSize: '0.9rem', marginBottom: '0.3rem', display: 'block' }}>Type</label>
                          <select value={med.type} onChange={e => updateOral(i, 'type', e.target.value)} style={{ width: '100%', padding: '0.85rem', background: 'var(--bg)', color: 'var(--silver)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                            <option value="prescription">Prescription</option>
                            <option value="otc">Over-the-Counter</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}`;

intake = intake.replace(oldOralRender, newOralRender);

// Quick check if I need to migrate old strings to objects on load:
const loadLogic = `if (ans.oralList) setOralList(ans.oralList);`;
const newLoadLogic = `if (ans.oralList) setOralList(ans.oralList.map(o => typeof o === 'string' ? { name: o, type: 'prescription' } : o));`;
intake = intake.replace(loadLogic, newLoadLogic);

fs.writeFileSync('src/screens/Intake.jsx', intake);
console.log('Intake.jsx patched.');

// Now Rootwork.jsx 12-zone UI
let rootwork = fs.readFileSync('src/screens/Rootwork.jsx', 'utf8');

const oldZonesUI = `<div className="field" style={{ margin: 0 }}>
                            <label style={{color: 'var(--plum)'}}>Application Zones</label>
                            <VoiceInput placeholder=""
                              value={(addForm.application_zones || []).join(', ')}
                              onChange={e => setAddForm({...addForm, application_zones: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} />
                          </div>`;

const newZonesUI = `<div className="field" style={{ margin: 0 }}>
                            <label style={{color: 'var(--plum)'}}>Application Zones</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)' }}>
                              {[
                                'Crown (scalp and hair)',
                                'Visage, above (forehead/brow skin and eyebrows)',
                                'Visage, midway (nose/cheek)',
                                'Visage, below (jaw/chin)',
                                'Gaze (lid/orbit skin, eyelashes, and the eye itself)',
                                'Grin (mouth, teeth, gums, tongue, and lips)',
                                'Veil (makeup)',
                                'Vessel (underarm)',
                                'Vessel (chest/back)',
                                'Vessel (arms/legs skin and body hair)',
                                'Vessel (hands/feet skin and nails)',
                                'Vessel (general body)'
                              ].map(z => (
                                <label key={z} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--silver)', fontSize: '0.9rem' }}>
                                  <input type="checkbox" checked={(addForm.application_zones || []).includes(z)} onChange={e => {
                                    const set = new Set(addForm.application_zones || []);
                                    if (e.target.checked) set.add(z); else set.delete(z);
                                    setAddForm({...addForm, application_zones: Array.from(set)});
                                  }} /> {z}
                                </label>
                              ))}
                            </div>
                          </div>`;

rootwork = rootwork.replace(oldZonesUI, newZonesUI);
fs.writeFileSync('src/screens/Rootwork.jsx', rootwork);
console.log('Rootwork.jsx patched.');

