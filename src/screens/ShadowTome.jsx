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
  const { alert, confirm } = useDialog();
  const [activeTab, setActiveTab] = useState('journal');
  const [moodsList, setMoodsList] = useState([]);
  const [selectedMoods, setSelectedMoods] = useState(new Set());
  const [entryText, setEntryText] = useState('');
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
    if (!alchemyForm.name || !alchemyForm.oil_reading_raw || !alchemyForm.oil_volume_ml || !alchemyForm.honey_volume_ml || !alchemyForm.lecithin_volume_ml) return;
    
    let rawReading = Number(alchemyForm.oil_reading_raw);
    let canonical_mg_per_ml = rawReading;
    if (alchemyForm.oil_reading_unit === 'mg/tsp') canonical_mg_per_ml = rawReading / 4.92892;
    else if (alchemyForm.oil_reading_unit === 'mg/Tbsp') canonical_mg_per_ml = rawReading / 14.7868;
    else if (alchemyForm.oil_reading_unit === 'mg/cup') canonical_mg_per_ml = rawReading / 236.588;

    const oilVol = Number(alchemyForm.oil_volume_ml);
    const honeyVol = Number(alchemyForm.honey_volume_ml);
    const lecVol = Number(alchemyForm.lecithin_volume_ml);
    const initialVol = oilVol + honeyVol + lecVol;
    const totalMg = canonical_mg_per_ml * oilVol;
    const finalMgMl = totalMg / initialVol;

    await supabase.from('alchemy_batches').insert([{
      name: alchemyForm.name,
      oil_reading_raw: rawReading,
      oil_reading_unit: alchemyForm.oil_reading_unit,
      canonical_mg_per_ml: canonical_mg_per_ml,
      oil_volume_ml: oilVol,
      honey_volume_ml: honeyVol,
      lecithin_volume_ml: lecVol,
      calculated_total_mg: totalMg,
      calculated_final_mg_ml: finalMgMl,
      initial_volume_ml: initialVol,
      remaining_volume_ml: initialVol,
      lifecycle_state: 'stocked'
    }]);
    
    setAlchemyForm(null);
    loadAlchemies();
  };

  const handleReplenishAlchemy = () => {
    startNewAlchemy();
  };

  const handleReleaseAlchemy = async (id) => {
    if (await confirm("Release this Alchemy? This action cannot be undone.")) {
      await supabase.from('alchemy_batches').delete().eq('id', id);
      loadAlchemies();
    }
  };

  const handleStageDram = (alchemyId, dram) => {
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
        parts.push(`${count}x ${dram.name}`);
      }
    });

    if (totalMlConsumed === 0) return;

    const mgConsumed = (activeAlch.calculated_final_mg_ml * totalMlConsumed).toFixed(2);
    const note = `✨ Imbibed: ${parts.join(', ')} (${totalMlConsumed}ml) of ${activeAlch.name} (${mgConsumed}mg THC).`;

    setEntryText(prev => prev ? prev + '\n\n' + note : note);
    alert('Added to today\'s journal entry');

    const newVol = activeAlch.remaining_volume_ml - totalMlConsumed;
    const ratio = newVol / activeAlch.initial_volume_ml;
    let newState = activeAlch.lifecycle_state;
    if (newVol <= 0) newState = 'hollow';
    else if (ratio < 0.2) newState = 'ebbing';

    await supabase.from('alchemy_batches').update({
      remaining_volume_ml: Math.max(0, newVol),
      lifecycle_state: newState
    }).eq('id', activeAlch.id);

    clearStagedDrams(alchemyId);
    loadHistory();
    loadAlchemies();
  };

  const handleSaveDram = async () => {
    if (!dramForm.name || !dramForm.vessel_volume_ml) return;
    await supabase.from('items').insert([{
      name: dramForm.name,
      vessel_volume_ml: parseFloat(dramForm.vessel_volume_ml),
      domain: 'Measure',
      item_type: 'tool',
      lifecycle_state: 'stocked'
    }]);
    setShowDramModal(false);
    setDramForm({ name: '', vessel_volume_ml: '' });
    loadDrams();
  };

  const handleConjureDramName = async () => {
    setIsRollingDram(true);
    try {
      const { data } = await supabase.functions.invoke('anthropic-proxy', {
        body: {
          messages: [{ role: 'user', content: 'Generate a single short poetic and whimsical name for a small measuring spoon/dram used for dosing honey (e.g., "The Silver Toll", "Waning Moon Spoon"). Return only the name, no quotes.' }],
          temperature: 0.9
        }
      });
      if (data && data.content && data.content[0]) {
        setDramForm(prev => ({ ...prev, name: data.content[0].text.trim() }));
      }
    } catch(e) { console.error(e); }
    setIsRollingDram(false);
  };

  const handleScanTCheck = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsScanningTCheck(true);
    try {
      const { compressImage } = await import('../lib/ai-engine.js');
      const newImages = [];
      for (const file of files) {
        const dataUrl = await compressImage(file, 1024, 0.8);
        const base64 = dataUrl.split(',')[1];
        newImages.push({ base64, mediaType: file.type });
      }
      const details = await parseTCheckImage(newImages);
      setAlchemyForm(prev => ({
        ...prev,
        oil_reading_raw: details.reading_raw,
        oil_reading_unit: details.reading_unit
      }));
      alert(`Vision extracted: ${details.reading_raw} ${details.reading_unit}`);
    } catch(err) {
      console.error(err);
      alert('Failed to divine reading: ' + err.message);
    }
    setIsScanningTCheck(false);
  };


  const loadHealthData = async () => {
    try {
      const readinessObj = await getReadiness();
      if (readinessObj) {
        setReadiness(readinessObj.state.toLowerCase());
        if (readinessObj.captured_at) {
          setHealthStaleness(new Date(readinessObj.captured_at).toLocaleString());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMood = (id) => {
    const next = new Set(selectedMoods);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMoods(next);
  };

  const handleAddCustomMood = () => {
    const txt = customMoodText.trim();
    if (txt) {
      const id = txt.toLowerCase().replace(/[^a-z0-9]/g, '-');
      // If it doesn't already exist, add it to the list
      if (!moodsList.find(m => m.id === id)) {
        setMoodsList(prev => [...prev, { id, label: txt }]);
      }
      // Select it
      const next = new Set(selectedMoods);
      next.add(id);
      setSelectedMoods(next);
      setCustomMoodText('');
      setShowCustomMood(false);
    }
  };

  const handleSave = async () => {
    const moodsArray = Array.from(selectedMoods);
    if (entryText || moodsArray.length > 0) {
      const currentText = entryText;
      const currentMoods = moodsArray;
      
      const optimisticEntry = {
        id: Date.now(),
        created_at: new Date().toISOString(),
        body_text: currentText,
        moods: currentMoods,
      };
      setHistory(prev => [optimisticEntry, ...prev]);
      
      setEntryText('');
      setSelectedMoods(new Set());
      
      await supabase.from('journal_entries').insert([{
        body_text: currentText,
        moods: currentMoods,
        moon_phase: 'Unknown',
        photos: []
      }]);
      loadHistory();
    }
  };

  const appendThcNote = () => {
    const note = `\u2728 Infusion: Consumed ${thcDose}ml of THC honey at ${thcStrength}mg/ml.`;
    setEntryText(prev => prev ? prev + '\n\n' + note : note);
  };

  const appendTeaNote = (tea) => {
    const note = `\u2728 Elixir: Drank ${tea.brand ? tea.brand + ' ' : ''}${tea.name} (Caffeine: ${tea.caffeine_content || 'None'}).`;
    setEntryText(prev => prev ? prev + '\n\n' + note : note);
  };

  const clearBreathTimers = () => {
    if (breathTimeout1Ref.current) clearTimeout(breathTimeout1Ref.current);
    if (breathTimeout2Ref.current) clearTimeout(breathTimeout2Ref.current);
    if (breathCycleRef.current) clearTimeout(breathCycleRef.current);
  };

  const handleBanish = async (id) => {
    if (await confirm("Unweave this spell from the tome? It cannot be recovered.")) {
      await supabase.from('journal_entries').delete().eq('id', id);
      loadHistory();
    }
  };

  const handleBanishTea = async (id, name) => {
    if (await confirm(`Shatter the jar of ${name}? It cannot be recovered.`)) {
      await supabase.from('items').update({ lifecycle_state: 'banished' }).eq('id', id);
      loadPantry();
    }
  };

  const handleScanTeaImage = async (e) => {
    console.log("HandleScanTeaImage triggered");
    const files = Array.from(e.target.files || []);
    console.log("Files:", files.length);
    if (!files.length) return;
    setIsDiviningTea(true);
    try {
      const { compressImage } = await import('../lib/ai-engine.js');
      const newImages = [];
      for (const file of files) {
        const dataUrl = await compressImage(file, 1024, 0.8);
        const base64 = dataUrl.split(',')[1];
        newImages.push({ base64, mediaType: file.type });
      }
      const details = await parseTeaImage(newImages);
      setTeaForm(prev => ({
        ...prev,
        brand: details.brand || '',
        name: details.name || '',
        ingredients: Array.isArray(details.ingredients) ? details.ingredients.join(', ') : (details.ingredients || ''),
        caffeine_content: details.caffeine_content || '',
        steep_time: details.steep_time || '',
        circadian_alignment: details.circadian_alignment || '',
        category: 'Tea'
      }));
      setTeaModalState('confirm');
      setShowTeaModal(true);
    } catch(err) {
      console.error(err);
      alert('Failed to divine tea: ' + err.message);
    }
    setIsDiviningTea(false);
  };

  const handleTeaLookup = async () => {
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
    } catch(err) {
      console.error(err);
      // Fallback: Proceed to manual confirm step even if AI fails
      setTeaForm(prev => ({
        ...prev,
        brand: candidate.brand || prev.brand,
        name: candidate.name || prev.name,
        ingredients: candidate.ingredients || ''
      }));
    } finally {
      setTeaModalState('confirm');
      setIsDiviningTea(false);
    }
  };

  const closeTeaModal = () => {
    setShowTeaModal(false);
    setTeaCandidates([]);
    setTeaForm({ brand: '', name: '', category: 'Tea', ingredients: '', caffeine_content: '', steep_time: '', circadian_alignment: '' });
    setTeaModalState('seed');
  };

  const handleSaveTea = async () => {
    if (!teaForm.name) return;
    setIsSavingTea(true);
    
    try {
      let user_id = (await supabase.auth.getUser()).data.user?.id;
      
      const res = await supabase.from('items').insert([{
        brand: teaForm.brand,
        name: teaForm.name,
        domain: 'Herbal Elixirs',
        category: teaForm.category,
        ingredients: JSON.stringify(teaForm.ingredients.split(',').map(s => s.trim()).filter(Boolean)),
        item_type: 'consumable',
        lifecycle_state: 'stocked',
        elixir_caffeine: teaForm.caffeine_content,
        elixir_steep_time: teaForm.steep_time,
        elixir_circadian: teaForm.circadian_alignment
      }]);
      if (res.error) console.error("Insert error:", res.error);
    } catch (err) {
      console.error("Save failed", err);
    }
    
    setIsSavingTea(false);
    fetchItems();
    closeTeaModal();
    loadPantry();
  };

  const startMeditation = () => {
    if (isBreathing) return;
    setIsBreathing(true);
    clearBreathTimers(); // Prevents overlapping cycles if triggered rapidly
    runMeditationCycle(3); // Run 3 cycles
  };

  const cancelMeditation = () => {
    clearBreathTimers();
    setIsBreathing(false);
    setBreathInst('Meditation Ceased');
    setBreathCircle({ transform: 'scale(1)', borderColor: 'var(--plum)', transition: 'all 0.5s ease' });
  };

  const runMeditationCycle = async (roundsLeft) => {
    if (roundsLeft === 0) {
      setIsBreathing(false);
      setBreathInst('Meditation Complete');
      setBreathCircle({ transform: 'scale(1)', borderColor: 'var(--plum)', transition: 'all 2s ease-in-out' });
      
      const exerciseType = readiness === 'low' ? '4-4-4-4 Box Breathing' : '4-7-8 Spirit Calming';
      const note = `✨ Meditation: Completed a session of ${exerciseType}.`;
      
      setHistory(prev => [{ id: Date.now(), created_at: new Date().toISOString(), body_text: note, moods: [] }, ...prev]);
      await supabase.from('journal_entries').insert([{
        body_text: note,
        moods: [],
        moon_phase: 'Unknown',
        photos: []
      }]);
      loadHistory();
      return;
    }

    if (readiness === 'low') {
      // Gentle Box Breathing (4-4-4-4) for low readiness
      setBreathInst('Inhale softly... (4s)');
      setBreathCircle({ transform: 'scale(1.5)', borderColor: 'var(--plum)', transition: 'transform 4s linear, border-color 4s ease' });
      
      breathTimeout1Ref.current = setTimeout(() => {
        setBreathInst('Hold gently... (4s)');
        setBreathCircle(prev => ({ ...prev, transform: 'scale(1.55)', transition: 'transform 4s linear' }));
      }, 4000);
      
      breathTimeout2Ref.current = setTimeout(() => {
        setBreathInst('Exhale slowly... (4s)');
        setBreathCircle({ transform: 'scale(1)', borderColor: 'var(--plum)', transition: 'transform 4s linear, border-color 4s ease' });
      }, 8000);

      // Third timeout for the bottom hold
      setTimeout(() => {
        if (!isBreathing) return; // Prevent race conditions if cancelled
        setBreathInst('Rest... (4s)');
        setBreathCircle(prev => ({ ...prev, transform: 'scale(0.95)', transition: 'transform 4s linear' }));
      }, 12000);

      breathCycleRef.current = setTimeout(() => {
        runMeditationCycle(roundsLeft - 1);
      }, 16000);

    } else {
      // Standard 4-7-8 Breathing
      setBreathInst('Inhale deeply... (4s)');
      setBreathCircle({ transform: 'scale(2)', borderColor: 'var(--plum)', transition: 'transform 4s linear, border-color 4s ease' });
      
      breathTimeout1Ref.current = setTimeout(() => {
        setBreathInst('Hold the breath... (7s)');
        setBreathCircle(prev => ({ ...prev, transform: 'scale(2.1)', transition: 'transform 7s linear' }));
      }, 4000);
      
      breathTimeout2Ref.current = setTimeout(() => {
        setBreathInst('Exhale slowly... (8s)');
        setBreathCircle({ transform: 'scale(1)', borderColor: 'var(--plum)', transition: 'transform 8s linear, border-color 8s ease' });
      }, 11000);

      breathCycleRef.current = setTimeout(() => {
        runMeditationCycle(roundsLeft - 1);
      }, 19000);
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {healthStaleness && (
        <div style={{ textAlign: 'center', color: 'var(--silver)', opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem' }}>
          Corporeal Data as of: {healthStaleness}
        </div>
      )}

      <div className="tome-grid mt-4">
        
        {/* Left Column: Journal & History */}
        <div className="tome-main-col">
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ textAlign: 'center', justifyContent: 'center' }}>The Inner Sanctum <SpeakerButton text="The Inner Sanctum" /></h3>
            <div className="note mb-4" style={{ fontSize: '1.2rem', textAlign: 'center' }}>"The ink is your own."</div>
            
            {/* Ethereal Breath Button */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--card2)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--dim)', marginBottom: '0.5rem' }}>
                {isBreathing ? breathInst : (readiness === 'low' ? '4-4-4-4 Box Breathing' : '4-7-8 Spirit Calming')}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {isBreathing && (
                  <button className="btn" onClick={cancelMeditation} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                    Cease
                  </button>
                )}
                <button className="btn plum" onClick={startMeditation} disabled={isBreathing} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', opacity: isBreathing ? 0.5 : 1 }}>
                  {isBreathing ? 'Inhaling...' : 'Begin Meditation'}
                </button>
              </div>
            </div>

            <div className="field" style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '1.15rem' }}>The Spirit's Temperament</label>
              <div className="chips" id="tome-moods">
                {moodsList.length === 0 ? (
                  <div style={{ opacity: 0.5 }}>Divining moods...</div>
                ) : (
                  <>
                    {moodsList.map(m => (
                      <span 
                        key={m.id} 
                        className={`chip ${selectedMoods.has(m.id) ? 'on' : ''}`} 
                        onClick={() => toggleMood(m.id)}
                      >
                        {m.label}
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>
            
            <div className="field" style={{ marginTop: '2.5rem' }}>
              <label>The Parchment Inscription</label>
              <VoiceInput 
                isTextArea={true}
                placeholder="Etch your reflections..."
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
                style={{ minHeight: '200px', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--plum)', fontSize: '1.1rem' }}
              />
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button id="btn-save-tome" className="btn plum" onClick={handleSave}>
                Bind the Parchment
              </button>
            </div>
          </div>

          <div id="tome-history" className="mt-4">
            {history.length === 0 ? null : (
              history.map(entry => (
                <div key={entry.id || entry.created_at} className="card mb-4" style={{ position: 'relative' }}>
                  <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div className="mt" style={{ margin: 0 }}>{new Date(entry.created_at).toLocaleDateString()}</div>
                    <button 
                      onClick={() => handleBanish(entry.id)} 
                      className="btn sm" 
                      style={{ background: 'transparent', border: '1px dashed rgba(212,28,60,0.4)', color: 'var(--dim)', fontSize: '0.7rem' }}
                      title="Unweave the spell"
                    >
                      <Icon name="ph-sparkle" /> Unweave
                    </button>
                  </div>

                  {entry.moods?.length > 0 && (
                    <div className="mb-2" style={{ color: 'var(--plum)', fontSize: '0.9rem' }}>
                      {entry.moods.map(id => {
                        const found = moodsList.find(m => m.id === id);
                        return found ? found.label : id;
                      }).join(' • ')}
                    </div>
                  )}
                  <div style={{ fontSize: '1.1rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {entry.body_text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Row 1: Herbal Elixirs */}
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <h3 style={{ fontSize: '1.5rem', textAlign: 'center' }}>The Herbal Elixirs <SpeakerButton text="The Herbal Elixirs" /></h3>
            
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
            <h3 style={{ fontSize: '1.5rem', textAlign: 'center' }}>The Herbarium <SpeakerButton text="The Herbarium" /></h3>
            
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
              <h3 style={{ fontSize: '1.5rem', textAlign: 'center' }}>The Alchemies <SpeakerButton text="The Alchemies" /></h3>
              
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
                  <h3 style={{ fontSize: '1.2rem', textAlign: 'center', margin: '0 0 1rem 0' }}>The Alchemist's Scale</h3>
                  <button className="btn" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }} onClick={() => setShowDramModal(true)}>
                    <Icon name="plus" /> Consecrate New Dram
                  </button>
                </div>
              </div>
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

                <button className="btn plum" onClick={handleSaveTea} disabled={isSavingTea}>
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
                    <button className="btn plum" onClick={handleSaveAlchemy}>Ignite the Alchemy</button>
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
  );
}

