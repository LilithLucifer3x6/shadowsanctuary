const fs = require('fs');

let content = fs.readFileSync('src/screens/ShadowTome.jsx', 'utf-8');

// 1. Imports
content = content.replace(
  "import { parseTeaImage } from '../lib/ai-engine.js';",
  "import { parseTeaImage, parseTCheckImage } from '../lib/ai-engine.js';"
);

// 2. Refs and States
content = content.replace(
  "const breathCycleRef = useRef(null);",
  "const breathCycleRef = useRef(null);\n  const tcheckInputRef = useRef(null);\n  const [isScanningTCheck, setIsScanningTCheck] = useState(false);"
);

// 3. handleScanTCheck
const oldScanTCheck = `  const handleScanTCheck = async () => {
    alert("tCheck OCR scan triggered (simulate success)");
    setAlchemyForm(prev => ({ ...prev, oil_reading_raw: '15', oil_reading_unit: 'mg/mL' }));
  };`;

const newScanTCheck = `  const handleScanTCheck = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsScanningTCheck(true);
    try {
      const newImages = [];
      for (const file of files) {
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(file);
        });
        newImages.push({ base64, mediaType: file.type });
      }
      const details = await parseTCheckImage(newImages);
      setAlchemyForm(prev => ({
        ...prev,
        oil_reading_raw: details.reading_raw,
        oil_reading_unit: details.reading_unit
      }));
      alert(\`Vision extracted: \${details.reading_raw} \${details.reading_unit}\`);
    } catch(err) {
      console.error(err);
      alert('Failed to divine reading: ' + err.message);
    }
    setIsScanningTCheck(false);
  };`;

content = content.replace(oldScanTCheck, newScanTCheck);

// 4. Staged Drams logic
const oldStageDram = `  const handleStageDram = (dram) => {
    setStagedDoses(prev => {
      const current = prev[dram.id] || { dram, count: 0 };
      return { ...prev, [dram.id]: { dram, count: current.count + 1 } };
    });
  };

  const clearStagedDrams = () => setStagedDoses({});

  const handleAnointElixir = async (alchemyId) => {
    const activeAlch = alchemies.find(a => a.id === alchemyId);
    if (!activeAlch) return;

    let totalMlConsumed = 0;
    const parts = [];
    Object.values(stagedDoses).forEach(({ dram, count }) => {
      if (count > 0) {
        totalMlConsumed += (dram.vessel_volume_ml * count);
        parts.push(\`\${count}x \${dram.name}\`);
      }
    });`;

const newStageDram = `  const handleStageDram = (alchemyId, dram) => {
    setStagedDoses(prev => {
      const currentAlch = prev[alchemyId] || {};
      const currentCount = currentAlch[dram.id]?.count || 0;
      return { 
        ...prev, 
        [alchemyId]: { ...currentAlch, [dram.id]: { dram, count: currentCount + 1 } }
      };
    });
  };

  const clearStagedDrams = (alchemyId) => {
    setStagedDoses(prev => {
      const next = { ...prev };
      delete next[alchemyId];
      return next;
    });
  };

  const handleAnointElixir = async (alchemyId) => {
    const activeAlch = alchemies.find(a => a.id === alchemyId);
    if (!activeAlch) return;

    let totalMlConsumed = 0;
    const parts = [];
    const alchDoses = stagedDoses[alchemyId] || {};
    Object.values(alchDoses).forEach(({ dram, count }) => {
      if (count > 0) {
        totalMlConsumed += (dram.vessel_volume_ml * count);
        parts.push(\`\${count}x \${dram.name}\`);
      }
    });`;

content = content.replace(oldStageDram, newStageDram);

// Fix clearStagedDrams in handleAnointElixir (we replace the `setStagedDoses({});` line)
// Need to be careful here
content = content.replace(
  "setStagedDoses({});\n    loadHistory();\n    loadAlchemies();\n  };\n\n  const handleSaveDram =",
  "clearStagedDrams(alchemyId);\n    loadHistory();\n    loadAlchemies();\n  };\n\n  const handleSaveDram ="
);


// 5. Update UI Button for tCheck
const oldButton = '<button className="btn sm mt-2" onClick={handleScanTCheck}><Icon name="ph-camera" /> Divine Reading (tCheck)</button>';
const newButton = `<button className="btn sm mt-2" onClick={() => tcheckInputRef.current?.click()} disabled={isScanningTCheck}>
                      <Icon name="ph-camera" /> {isScanningTCheck ? 'Divining...' : 'Divine Reading (tCheck)'}
                    </button>
                    <input type="file" accept="image/*" capture="environment" ref={tcheckInputRef} style={{ display: 'none' }} onChange={handleScanTCheck} />`;

content = content.replace(oldButton, newButton);


// 6. Update UI for stagedDoses
const oldStagedUI = `                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {drams.map(d => (
                              <button key={d.id} className="btn sm" onClick={() => handleStageDram(d)}>
                                Imbibe 1x {d.name}
                              </button>
                            ))}
                          </div>
                          {Object.keys(stagedDoses).length > 0 && (
                            <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                              <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                Staged: {Object.values(stagedDoses).filter(sd => sd.count > 0).map(sd => \`\${sd.count}x \${sd.dram.name}\`).join(', ')}
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn sm" onClick={clearStagedDrams}>Clear</button>
                                <button className="btn sm plum" style={{ flex: 1 }} onClick={() => handleAnointElixir(alch.id)}>Anoint the Elixir</button>
                              </div>
                            </div>
                          )}`;

const newStagedUI = `                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {drams.map(d => (
                              <button key={d.id} className="btn sm" onClick={() => handleStageDram(alch.id, d)}>
                                Imbibe 1x {d.name}
                              </button>
                            ))}
                          </div>
                          {stagedDoses[alch.id] && Object.keys(stagedDoses[alch.id]).length > 0 && (
                            <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                              <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                Staged: {Object.values(stagedDoses[alch.id]).filter(sd => sd.count > 0).map(sd => \`\${sd.count}x \${sd.dram.name}\`).join(', ')}
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn sm" onClick={() => clearStagedDrams(alch.id)}>Clear</button>
                                <button className="btn sm plum" style={{ flex: 1 }} onClick={() => handleAnointElixir(alch.id)}>Anoint the Elixir</button>
                              </div>
                            </div>
                          )}`;

content = content.replace(oldStagedUI, newStagedUI);

fs.writeFileSync('src/screens/ShadowTome.jsx', content);
console.log('Fix applied!');
