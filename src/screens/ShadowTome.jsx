import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { ic, G } from '../lib/icons.jsx';
import { attachVoice } from '../lib/voice.js';
import * as AI from '../lib/ai-service.js';
import { parseTeaImage, parseTCheckImage } from '../lib/ai-engine.js';
import SpeakerButton from '../components/SpeakerButton.jsx';
import Icon from '../components/Icon.jsx';
import VoiceInput from '../components/VoiceInput.jsx';
import { useDialog } from '../components/Dialogs.jsx';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { ic, G } from '../lib/icons.jsx';
import { attachVoice } from '../lib/voice.js';
import * as AI from '../lib/ai-service.js';
import { parseTeaImage, parseTCheckImage } from '../lib/ai-engine.js';
import SpeakerButton from '../components/SpeakerButton.jsx';
import Icon from '../components/Icon.jsx';
import VoiceInput from '../components/VoiceInput.jsx';
import { useDialog } from '../components/Dialogs.jsx';
import { getReadiness } from '../lib/health-connect.js';

export default function ShadowTome({ pose }) {
  const { alert, confirm, confirmDestructive } = useDialog();
  const [activeTab, setActiveTab] = useState('journal');
  const [moodsList, setMoodsList] = useState([]);
  const [selectedMoods, setSelectedMoods] = useState(new Set());
  const [entryText, setEntryText] = useState('');
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [showCustomMood, setShowCustomMood] = useState(false);
  const [customMoodText, setCustomMoodText] = useState('');
  
  // Breathwork State
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathInst, setBreathInst] = useState('');
  const [breathCircle, setBreathCircle] = useState({ transform: 'scale(1)', borderColor: 'var(--plum)' });
  const [readiness, setReadiness] = useState('normal');
  const [healthStaleness, setHealthStaleness] = useState('');
  
  const [history, setHistory] = useState([]);
  
  // Herbal Pantry State
  const [pantry, setPantry] = useState([]);
  const [showTeaModal, setShowTeaModal] = useState(false);
  const [stillroomItems, setStillroomItems] = useState([]);
  const [teaModalState, setTeaModalState] = useState('photo'); // photo, manual, confirm
  const [teaStatus, setTeaStatus] = useState('Offer or Divine Vision');
  const [teaImages, setTeaImages] = useState([]);
  const [isSavingTea, setIsSavingTea] = useState(false);
    const [drams, setDrams] = useState([]);
  const [showDramModal, setShowDramModal] = useState(false);
  const [dramForm, setDramForm] = useState({ name: '', vessel_volume_ml: '' });
  const [alchemies, setAlchemies] = useState([]);
  const [alchemyForm, setAlchemyForm] = useState(null);
  const [stagedDoses, setStagedDoses] = useState({});
  const [isRollingDram, setIsRollingDram] = useState(false);


  const [teaForm, setTeaForm] = useState({
    brand: '', name: '', category: 'Tea', ingredients: '', caffeine_content: '', steep_time: '', circadian_alignment: ''
  });

  const breathTimeout1Ref = useRef(null);
  const breathTimeout2Ref = useRef(null);
  const breathCycleRef = useRef(null);
  const tcheckInputRef = useRef(null);
  const [isScanningTCheck, setIsScanningTCheck] = useState(false);
  const [isDiviningTea, setIsDiviningTea] = useState(false);
  const [teaCandidates, setTeaCandidates] = useState([]);


  useEffect(() => {
    AI.generateMoods().then(list => setMoodsList(list || [])).catch(console.error);
    loadHistory();
    loadPantry();
    loadStillroom();
    loadHealthData();
    loadDrams();
    loadAlchemies();
    
    return () => {
      clearBreathTimers();
    };
  }, []);

  const loadHistory = async () => {
    try {
      const { data } = await supabase.from('journal_entries').select('*').order('created_at', { ascending: false }).limit(5);
      if (data) setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

    const loadPantry = async () => {
    try {
      const { data } = await supabase.from('items')
        .select('*')
        .eq('domain', 'Herbal Elixirs')
        .eq('lifecycle_state', 'stocked')
        .order('name');
      if (data) setPantry(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStillroom = async () => {
    try {
      const { data } = await supabase.from('items')
        .select('*')
        .order('name');
      if (data) {
        const keywords = ['oil', 'honey', 'lecithin', 'mct', 'carrier', 'raw herb', 'botanical'];
        const stillroom = data.filter(i => {
          // Broaden text search to include ingredients
          const text = ((i.name || '') + ' ' + (i.category || '') + ' ' + (i.ingredients || '')).toLowerCase();
          const isMatch = keywords.some(k => text.includes(k));
          // It's a Stillroom item if it matches keywords and is NOT a tea/blend. 
          // Do not arbitrarily exclude 'Measure' or 'Herbal Elixirs' domains because users may classify ingredients there.
          const isNotTea = !text.includes('tea') && !text.includes('blend') && i.category !== 'Tea' && i.category !== 'tea';
          return isMatch && isNotTea;
        });
        setStillroomItems(stillroom);
      }
    } catch (e) {
      console.error(e);
    }
  };

    const loadDrams = async () => {
    try {
      const { data } = await supabase.from('items').select('*').eq('domain', 'Measure').eq('lifecycle_state', 'stocked').order('created_at', { ascending: false });
      if (data) setDrams(data);
    } catch(e) { console.error(e); }
  };

  const loadAlchemies = async () => {
    try {
      const { data } = await supabase.from('alchemy_batches').select('*').in('lifecycle_state', ['stocked', 'ebbing', 'hollow']).order('created_at', { ascending: false });
      if (data) setAlchemies(data);
    } catch(e) { console.error(e); }
  };

  const startNewAlchemy = () => {
    setAlchemyForm({
      name: '',
      oil_reading_raw: '',
      oil_reading_unit: 'mg/mL',
      oil_volume_ml: '',
      honey_volume_ml: '',
      lecithin_volume_ml: ''
    });
  };

  const cancelAlchemy = () => setAlchemyForm(null);

  const handleSaveAlchemy = async () => {

    // Lavender Check
    if (/(lavender|lavandula|lavandin)/i.test(alchemyForm.name || '')) {
      await alert("LAVENDER DETECTED: This alchemy contains Lavender and is permanently banned. It will not be crafted.");
      return;
    }

        {/* Right Column: Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Row 1: Herbal Elixirs */}
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ fontSize: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <i className="ph-duotone ph-brandy"></i> The Herbal Elixirs <SpeakerButton text="The Herbal Elixirs" />
            </h3>
            
            <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--card2)', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem', color: 'var(--plum)', cursor: 'pointer', borderRadius: '8px', marginTop: '1rem' }}>
              <Icon name="ph-camera" /> 
              <span style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '1rem' }}>Divine The Consecrated Elements</span>
              <input type="file" accept="image/*" capture="environment" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} onChange={handleScanTeaImage} />
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button className="btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} onClick={() => { setShowTeaModal(true); setTeaModalState('seed'); }}>Seek in the Codex</button>
            </div>
          </div>

          {/* Row 2: Botanical Trove */}
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ fontSize: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <i className="ph-duotone ph-leaf"></i> The Herbarium <SpeakerButton text="The Herbarium" />
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pantry.length > 0 ? pantry.map(tea => (
                <div className="row" key={tea.id} style={{ alignItems: 'flex-start' }}>
                  <div className="tg">
                    <Icon name="ph-leaf" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="nm">{tea.name}</div>
                    <div className="mt">{tea.brand} &bull; {tea.circadian_alignment}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--dim)', marginTop: '0.2rem' }}>
                      <span style={{ color: 'var(--plum)' }}>The Steeping:</span> {tea.steep_time || 'Unknown'} <br/>
                      <span style={{ color: 'var(--plum)' }}>Stimulating Vigor:</span> {tea.caffeine_content || 'Unknown'}
                    </div>
                  </div>
                  <div className="acts" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn sm" onClick={() => appendTeaNote(tea)}>Imbibe</button>
                    <button className="btn sm g" onClick={() => handleBanishTea(tea.id, tea.name)}>Shatter Jar</button>
                  </div>
                </div>
              )) : (
                <div className="empty">The herbarium is bare.</div>
              )}
            </div>
          </div>

          {/* Row 2.5: The Stillroom */}
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <div>
              <h3 style={{ fontSize: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <i className="ph-duotone ph-faucet"></i> The Stillroom
              </h3>
              <div style={{ color: 'var(--dim)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>Raw botanicals and carrier oils.</div>
              {stillroomItems.length === 0 ? (
                <div className="empty" style={{ padding: '1rem' }}>The stillroom is bare.</div>
              ) : (
                <div className="rites2">
                  {stillroomItems.map(item => (
                    <div key={item.id} className="act" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--plum)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem' }}>{item.brand} â€¢ {item.category}</div>
                      </div>
                      <div style={{ color: 'var(--gold)' }}>{item.weight ? `${item.weight}g` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Alchemies */}
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
              <h3 style={{ fontSize: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <i className="ph-duotone ph-magic-wand"></i> The Alchemies <SpeakerButton text="The Alchemies" />
              </h3>
              
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {alchemies.map(alch => (
                  <div key={alch.id} style={{ background: 'var(--card2)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: 'var(--plum)', fontWeight: 'bold', fontSize: '1.1rem' }}>{alch.name}</div>
                      <div style={{ fontSize: '0.8rem', color: alch.lifecycle_state === 'ebbing' ? 'var(--orange)' : (alch.lifecycle_state === 'hollow' ? 'var(--red)' : 'var(--green)') }}>
                        {alch.lifecycle_state === 'stocked' ? 'Endowed' : alch.lifecycle_state}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--dim)', margin: '0.5rem 0' }}>
                      Strength: {Number(alch.calculated_final_mg_ml).toFixed(2)} mg/ml <br/>
                      Remaining: {Number(alch.remaining_volume_ml).toFixed(1)} / {Number(alch.initial_volume_ml).toFixed(1)} ml
                    </div>

                    {alch.lifecycle_state === 'hollow' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="btn sm" style={{ flex: 1 }} onClick={handleReplenishAlchemy}>Replenish</button>
                        <button className="btn sm g" style={{ flex: 1 }} onClick={() => handleReleaseAlchemy(alch.id)}>Release the Alchemy</button>
                      </div>
                    ) : (
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--plum)', marginBottom: '0.5rem' }}>Anoint with a Dram:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {drams.map(d => (
                            <button key={d.id} className="btn sm" onClick={() => handleStageDram(alch.id, d)}>
                              Imbibe 1x {d.name}
                            </button>
                          ))}
                        </div>
                        {stagedDoses[alch.id] && Object.keys(stagedDoses[alch.id]).length > 0 && (
                          <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                              Staged: {Object.values(stagedDoses[alch.id]).filter(sd => sd.count > 0).map(sd => `${sd.count}x ${sd.dram.name}`).join(', ')}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn sm" onClick={() => clearStagedDrams(alch.id)}>Clear</button>
                              <button className="btn sm plum" style={{ flex: 1 }} onClick={() => handleAnointElixir(alch.id)}>Anoint the Elixir</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button className="btn plum" onClick={startNewAlchemy}>Ignite New Alchemy</button>
                </div>
                <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
                  <h3 style={{ fontSize: '1.2rem', textAlign: 'center', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <i className="ph-duotone ph-scales"></i> The Alchemist's Scale
                  </h3>
                  <button className="btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} onClick={() => setShowDramModal(true)}>
                    <Icon name="plus" /> Consecrate New Dram
                  </button>
                </div>
              </div>
          </div>

      {/* Tea Scanner Modal */}
      {showTeaModal && (
        <div className="modal">
          <div className="modal-content card" style={{maxWidth: '500px'}}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div style={{width: '100%'}}>
                <h3 style={{color: 'var(--plum)', textAlign: 'center', justifyContent: 'center'}}>The Herbal Elixir Inscription</h3>
                <div className="mt mb-4" style={{color: 'var(--plum)', textAlign: 'center'}}>Add a new tea blend to your botanical trove.</div>
              </div>
            </div>

            {teaModalState === 'seed' && (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <input type="text" placeholder="Brand / Lineage" value={teaForm.brand} onChange={e => setTeaForm({...teaForm, brand: e.target.value})} />
                <input type="text" placeholder="Product / Blend Name" value={teaForm.name} onChange={e => setTeaForm({...teaForm, name: e.target.value})} />
                <input type="text" placeholder="Steeping Instructions (e.g. 5 mins at 212F)" value={teaForm.steep_time} onChange={e => setTeaForm({...teaForm, steep_time: e.target.value})} />
                
                <button className="btn plum" onClick={handleTeaLookup} disabled={isDiviningTea || !teaForm.brand || !teaForm.name}>
                  {isDiviningTea ? 'Divining...' : 'Seek in the Codex'}
                </button>
              </div>
            )}

            {teaModalState === 'candidates' && (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div style={{color: 'var(--plum)'}}>Visions from the collective memory (Open Food Facts):</div>
                {teaCandidates.length === 0 ? (
                  <div style={{color: 'var(--dim)', textAlign: 'center'}}>No matching visions found.</div>
                ) : (
                  <div style={{maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    {teaCandidates.map(c => (
                      <div key={c.id} className="card" style={{padding: '0.5rem', cursor: 'pointer', background: 'var(--bg)'}} onClick={() => handleTeaCandidateSelect(c)}>
                        <strong>{c.brand}</strong> &bull; {c.name}<br/>
                        <small style={{color: 'var(--dim)'}}>{c.ingredients.substring(0, 50)}...</small>
                      </div>
                    ))}
                  </div>
                )}
                
                <button className="btn plum" onClick={() => handleTeaCandidateSelect({ brand: teaForm.brand, name: teaForm.name, ingredients: '' })} disabled={isDiviningTea}>
                  {isDiviningTea ? 'Divining...' : 'No Match - Proceed with AI Fallback'}
                </button>
              </div>
            )}

            {teaModalState === 'confirm' && (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div style={{color: 'var(--plum)', fontSize: '0.9rem'}}>Review the derived essence before inscription.</div>
                
                <label style={{fontSize:'0.8rem', color:'var(--dim)'}}>Brand</label>
                <input type="text" value={teaForm.brand} onChange={e => setTeaForm({...teaForm, brand: e.target.value})} />
                
                <label style={{fontSize:'0.8rem', color:'var(--dim)'}}>Name</label>
                <input type="text" value={teaForm.name} onChange={e => setTeaForm({...teaForm, name: e.target.value})} />
                
                <label style={{fontSize:'0.8rem', color:'var(--dim)'}}>Botanicals / Ingredients</label>
                <textarea rows="2" value={teaForm.ingredients} onChange={e => setTeaForm({...teaForm, ingredients: e.target.value})}></textarea>
                
                <div style={{display: 'flex', gap: '1rem'}}>
                  <div style={{flex: 1}}>
                    <label style={{fontSize:'0.8rem', color:'var(--dim)'}}>Caffeine</label>
                    <input type="text" value={teaForm.caffeine_content} onChange={e => setTeaForm({...teaForm, caffeine_content: e.target.value})} />
                  </div>
                  <div style={{flex: 1}}>
                    <label style={{fontSize:'0.8rem', color:'var(--dim)'}}>Circadian</label>
                    <input type="text" value={teaForm.circadian_alignment} onChange={e => setTeaForm({...teaForm, circadian_alignment: e.target.value})} />
                  </div>
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                  <div style={{flex: 1}}>
                    <label style={{fontSize:'0.8rem', color:'var(--dim)'}}>Character</label>
                    <input type="text" value={teaForm.category} onChange={e => setTeaForm({...teaForm, category: e.target.value})} />
                  </div>
                  <div style={{flex: 1}}>
                    <label style={{fontSize:'0.8rem', color:'var(--dim)'}}>Steep Time</label>
                    <input type="text" value={teaForm.steep_time} onChange={e => setTeaForm({...teaForm, steep_time: e.target.value})} />
                  </div>
                </div>

                <button className="btn plum" onClick={handleSaveTea} disabled={isSavingTea || !teaForm.name}>
                  {isSavingTea ? 'Inscribing...' : 'Save to Herbarium'}
                </button>
              </div>
            )}

            <button className="btn" style={{marginTop: '1rem', width: '100%'}} onClick={closeTeaModal}>Close</button>
          </div>
        </div>
      )}

      {/* Vessel Scanner Modal */}
      
      {alchemyForm && (
        <div className="modal">
          <div className="modal-content card" style={{maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', margin: 'auto'}}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{color: 'var(--plum)', textAlign: 'center'}}>Ignite New Alchemy</h3>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--border)' }}>
                    <div style={{ color: 'var(--plum)', marginBottom: '0.5rem', fontWeight: 'bold' }}>1. The Transmutation (Oil Infusion)</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Potency</label>
                        <input type="number" value={alchemyForm.oil_reading_raw} onChange={e => setAlchemyForm({...alchemyForm, oil_reading_raw: e.target.value})} style={{ background: 'var(--card2)', color: 'var(--plum)' }} />
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Unit</label>
                        <select value={alchemyForm.oil_reading_unit} onChange={e => setAlchemyForm({...alchemyForm, oil_reading_unit: e.target.value})} style={{ background: 'var(--card2)', color: 'var(--plum)', width: '100%', padding: '0.4rem' }}>
                          <option value="mg/mL">mg/mL</option>
                          <option value="mg/tsp">mg/tsp</option>
                          <option value="mg/Tbsp">mg/Tbsp</option>
                          <option value="mg/cup">mg/cup</option>
                        </select>
                      </div>
                    </div>
                    <button className="btn sm mt-2" onClick={() => tcheckInputRef.current?.click()} disabled={isScanningTCheck}>
                      <Icon name="ph-camera" /> {isScanningTCheck ? 'Divining...' : 'Divine Reading (tCheck)'}
                    </button>
                    <input type="file" accept="image/*" capture="environment" ref={tcheckInputRef} style={{ display: 'none' }} onChange={handleScanTCheck} />
                  </div>

                  <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--border)' }}>
                    <div style={{ color: 'var(--plum)', marginBottom: '0.5rem', fontWeight: 'bold' }}>2. The Final Binding</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Oil (ml)</label>
                        <input type="number" value={alchemyForm.oil_volume_ml} onChange={e => setAlchemyForm({...alchemyForm, oil_volume_ml: e.target.value})} style={{ background: 'var(--card2)', color: 'var(--plum)' }} />
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Honey (ml)</label>
                        <input type="number" value={alchemyForm.honey_volume_ml} onChange={e => setAlchemyForm({...alchemyForm, honey_volume_ml: e.target.value})} style={{ background: 'var(--card2)', color: 'var(--plum)' }} />
                      </div>
                      <div className="field" style={{ flex: 1 }}>
                        <label>Lecithin (ml)</label>
                        <input type="number" value={alchemyForm.lecithin_volume_ml} onChange={e => setAlchemyForm({...alchemyForm, lecithin_volume_ml: e.target.value})} style={{ background: 'var(--card2)', color: 'var(--plum)' }} />
                      </div>
                    </div>
                  </div>

                  <div className="field" style={{ marginBottom: '1.5rem' }}>
                    <label>Name the Alchemy</label>
                    <input type="text" value={alchemyForm.name} onChange={e => setAlchemyForm({...alchemyForm, name: e.target.value})} style={{ background: 'var(--card2)', color: 'var(--plum)', width: '100%', padding: '0.4rem' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="btn" onClick={cancelAlchemy}>Abandon</button>
                    <button className="btn plum" onClick={handleSaveAlchemy} disabled={!alchemyForm.name || !alchemyForm.oil_reading_raw || !alchemyForm.oil_volume_ml || !alchemyForm.honey_volume_ml || !alchemyForm.lecithin_volume_ml}>Ignite the Alchemy</button>
                  </div>
                </div>
          </div>
        </div>
      )}

      {showDramModal && (
        <div className="modal">
          <div className="modal-content card" style={{maxWidth: '400px'}}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            
            <h3 style={{color: 'var(--plum)', textAlign: 'center'}}>Register a Dram</h3>
            <div className="mt mb-4" style={{color: 'var(--plum)', textAlign: 'center'}}>Name the dram and declare its true volume (ml).</div>
            
            <div className="field">
              <label>Name</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" value={dramForm.name} onChange={e => setDramForm({...dramForm, name: e.target.value})} style={{ background: 'var(--card2)', color: 'var(--plum)', flex: 1, padding: '0.5rem' }} />
                <button className="btn sm" onClick={handleConjureDramName} disabled={isRollingDram}>
                  {isRollingDram ? '...' : <><Icon name="ph-sparkle" /> Conjure Form</>}
                </button>
              </div>
            </div>
            
            <div className="field mt-3">
              <label>Volume Capacity (ml)</label>
              <input type="number" step="0.1" value={dramForm.vessel_volume_ml} onChange={e => setDramForm({...dramForm, vessel_volume_ml: e.target.value})} style={{ background: 'var(--card2)', color: 'var(--plum)', width: '100%', padding: '0.5rem' }} />
            </div>
            
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem'}}>
              <button className="btn" onClick={() => setShowDramModal(false)}>Abandon</button>
              <button className="btn plum" onClick={handleSaveDram} disabled={!dramForm.name || !dramForm.vessel_volume_ml}>
                Register Dram
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
    </div>
    </div>
  );
}

