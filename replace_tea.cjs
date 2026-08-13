const fs = require('fs');
let code = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf8');

// 1. Replace the state
const oldState = `  const [showTeaModal, setShowTeaModal] = useState(false);
  const [teaModalState, setTeaModalState] = useState('photo'); // photo, manual, confirm
  const [teaStatus, setTeaStatus] = useState('Offer or Divine Vision');
  const [teaImages, setTeaImages] = useState([]);
  const [isSavingTea, setIsSavingTea] = useState(false);`;
const newState = `  const [showTeaModal, setShowTeaModal] = useState(false);
  const [teaModalState, setTeaModalState] = useState('seed'); // seed, candidates, confirm
  const [isSavingTea, setIsSavingTea] = useState(false);
  const [teaCandidates, setTeaCandidates] = useState([]);
  const [isDiviningTea, setIsDiviningTea] = useState(false);`;
code = code.replace(oldState, newState);

// 2. Replace the handleTeaUpload and closeTeaModal functions
// It spans from handleTeaUpload to just before handleSaveTea
const handleSaveIndex = code.indexOf('  const handleSaveTea = async () => {');
const handleUploadIndex = code.indexOf('  const handleTeaUpload = async (e) => {');
const handlersChunk = code.substring(handleUploadIndex, handleSaveIndex);

const newHandlers = `  const handleTeaLookup = async () => {
    if (!teaForm.brand || !teaForm.name) return;
    setIsDiviningTea(true);
    try {
      const { searchOpenFoodFacts } = await import('../lib/ai-engine.js');
      const results = await searchOpenFoodFacts(teaForm.brand + ' ' + teaForm.name);
      setTeaCandidates(results);
      setTeaModalState('candidates');
    } catch(err) {
      console.error(err);
      alert('Failed to lookup tea.');
    } finally {
      setIsDiviningTea(false);
    }
  };

  const handleTeaCandidateSelect = async (candidate) => {
    setIsDiviningTea(true);
    try {
      const { fallbackTeaAnalysis } = await import('../lib/ai-engine.js');
      const analysis = await fallbackTeaAnalysis(candidate.brand || teaForm.brand, candidate.name || teaForm.name, candidate.ingredients);
      setTeaForm(prev => ({
        ...prev,
        brand: candidate.brand || prev.brand,
        name: candidate.name || prev.name,
        ingredients: candidate.ingredients || analysis.botanicals || '',
        caffeine_content: analysis.caffeine || '',
        circadian_alignment: analysis.circadian || '',
        category: analysis.character || prev.category
      }));
      setTeaModalState('confirm');
    } catch(err) {
      console.error(err);
      alert('Failed to analyze tea properties.');
    } finally {
      setIsDiviningTea(false);
    }
  };

  const closeTeaModal = () => {
    setShowTeaModal(false);
    setTeaCandidates([]);
    setTeaForm({ brand: '', name: '', category: 'Tea', ingredients: '', caffeine_content: '', steep_time: '', circadian_alignment: '' });
    setTeaModalState('seed');
  };

`;

code = code.replace(handlersChunk, newHandlers);

// 3. Update the UI for the main button
const oldButtonUi = `<button className="btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} onClick={() => { setShowTeaModal(true); setTeaModalState('manual'); }}>Summon by Hand</button>`;
const newButtonUi = `<button className="btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} onClick={() => { setShowTeaModal(true); setTeaModalState('seed'); }}>Summon Tea Blends</button>`;
code = code.replace(oldButtonUi, newButtonUi);

// 4. Update the actual Tea Scanner Modal UI
// We will replace everything from {/* Tea Scanner Modal */} down to the next modal
const uiStartStr = '{/* Tea Scanner Modal */}';
const uiEndStr = '{/* Vessel Scanner Modal */}';
const uiStart = code.indexOf(uiStartStr);
const uiEnd = code.indexOf(uiEndStr);

const newUi = `{/* Tea Scanner Modal */}
      {showTeaModal && (
        <div className="modal" style={{display: 'block'}}>
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
                <input type="text" placeholder="Brand / Lineage (e.g. Celestial Seasonings)" value={teaForm.brand} onChange={e => setTeaForm({...teaForm, brand: e.target.value})} />
                <input type="text" placeholder="Product Name (e.g. Sleepytime)" value={teaForm.name} onChange={e => setTeaForm({...teaForm, name: e.target.value})} />
                <input type="text" placeholder="Steeping Instructions (e.g. 5 mins at 212F)" value={teaForm.steep_time} onChange={e => setTeaForm({...teaForm, steep_time: e.target.value})} />
                
                <button className="btn plum" onClick={handleTeaLookup} disabled={isDiviningTea || !teaForm.brand || !teaForm.name}>
                  {isDiviningTea ? 'Divining...' : 'Lookup Blend'}
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

                <button className="btn plum" onClick={handleSaveTea} disabled={isSavingTea}>
                  {isSavingTea ? 'Inscribing...' : 'Save to Herbarium'}
                </button>
              </div>
            )}

            <button className="btn" style={{marginTop: '1rem', width: '100%'}} onClick={closeTeaModal}>Close</button>
          </div>
        </div>
      )}

      `;

code = code.substring(0, uiStart) + newUi + code.substring(uiEnd);

fs.writeFileSync('src/screens/ShadowTome.jsx', code);
