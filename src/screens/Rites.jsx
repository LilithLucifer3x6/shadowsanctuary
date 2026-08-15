import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { G } from '../lib/icons.jsx';
import Icon from '../components/Icon.jsx';
import SpeakerButton from '../components/SpeakerButton.jsx';
import { buildRoutines, checkConflicts, filterLesserRite } from '../lib/routine-engine.js';
import { getReadiness, getHeavySweat, getSleepDuration } from '../lib/health-connect.js';

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const buildPayload = (id, rType) => ({
  completed_at: new Date().toISOString(),
  routine_type: rType,
  step_name: id,
  ...(isUUID(id) ? { item_id: id } : {})
});

export default function Rites({ pose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amItems, setAmItems] = useState([]);
  const [pmItems, setPmItems] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [amSaving, setAmSaving] = useState(false);
  const [amSaved, setAmSaved] = useState(false);
  const [noRx, setNoRx] = useState(false);
  const [healthStaleness, setHealthStaleness] = useState('');
  const [pmSaving, setPmSaving] = useState(false);
  const [pmSaved, setPmSaved] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);
  
  const [useAmLesserRite, setUseAmLesserRite] = useState(false);
  const [usePmLesserRite, setUsePmLesserRite] = useState(false);
  const [suggestLesserRite, setSuggestLesserRite] = useState(false);

  const todayKey = new Date().toISOString().split('T')[0];
  const [scheduleChecked, setScheduleChecked] = useState(() => {
    try {
      const saved = localStorage.getItem(`schedule_${todayKey}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch(e) { return new Set(); }
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data } = await supabase
        .from('items')
        .select('*')
        .in('lifecycle_state', ['stocked', 'ebbing', 'enshrined'])
        .order('category', { ascending: true });
        
      const itemsArr = data || [];
      setItems(itemsArr);
      
      const sleepDuration = await getSleepDuration();
      const heavySweat = await getHeavySweat();
      const readinessObj = await getReadiness();
      const score = readinessObj?.score || 100;
      
      if (score < 60) {
        setSuggestLesserRite(true);
      }
      
      if (readinessObj?.captured_at) {
        setHealthStaleness(new Date(readinessObj.captured_at).toLocaleString());
      }
      
      const realWearables = {
        sleepDuration: parseFloat(sleepDuration),
        heavySweat: heavySweat,
        readiness: score
      };
      
      const { data: userProfile } = await supabase.from('user_profile').select('*').maybeSingle();
      const { amItems: am, pmItems: pm } = await buildRoutines(itemsArr, userProfile || {}, realWearables);
      
      const { data: isoLogsArr } = await supabase.from('isotretinoin_log').select('*').order('last_confirmed_date', { ascending: false });
      const lastTakenLog = isoLogsArr?.find(l => l.last_confirmed_dose_mg > 0);
      const nextDose = lastTakenLog ? (lastTakenLog.last_confirmed_dose_mg === 40 ? 80 : 40) : 40;
      
      const isoItem = {
        id: `iso-${nextDose}`,
        name: `Isotretinoin, oral`,
        category: 'immutable',
        isInjected: true,
        desc: 'Systemic / Morning Rite',
        isRx: true,
        glyph: 'pill',
        expectedDose: nextDose
      };
      
      setAmItems([isoItem, ...am]);
      setPmItems(pm);
      setConflicts(checkConflicts(itemsArr, userProfile || {}));
      
      setLoading(false);
    }
    
    fetchData();
  }, []);

  const handleSaveAm = async () => {
    setAmSaving(true);
    const amChecked = amItems.filter(i => checkedIds.has(i.id)).map(i => i.id);
    if (amChecked.length > 0) {
      await supabase.from('routine_history').insert(amChecked.map(id => buildPayload(id, 'morning')));
    }
    setAmSaved(true);
    setAmSaving(false);
  };

  const handleSavePm = async () => {
    setPmSaving(true);
    const pmChecked = pmItems.filter(i => checkedIds.has(i.id)).map(i => i.id);
    if (pmChecked.length > 0) {
      await supabase.from('routine_history').insert(pmChecked.map(id => buildPayload(id, 'evening')));
    }
    setPmSaved(true);
    setPmSaving(false);
  };

  function getRitualDate() {
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const day = d.getDate();
    let suffix = "th";
    if (day % 10 === 1 && day !== 11) suffix = "st";
    else if (day % 10 === 2 && day !== 12) suffix = "nd";
    else if (day % 10 === 3 && day !== 13) suffix = "rd";
    return `The ${day}${suffix} of ${months[d.getMonth()]}`;
  }

  if (loading) {
    return (
      <div className="card">
        <div className="empty">Consulting the rites...</div>
      </div>
    );
  }

  const activeAmItems = useAmLesserRite ? filterLesserRite(amItems) : amItems;
  const activePmItems = usePmLesserRite ? filterLesserRite(pmItems) : pmItems;

  const handleScheduleCheck = (time) => {
    const newChecked = new Set(scheduleChecked);
    if (newChecked.has(time)) newChecked.delete(time);
    else newChecked.add(time);
    setScheduleChecked(newChecked);
    localStorage.setItem(`schedule_${todayKey}`, JSON.stringify(Array.from(newChecked)));
  };

  const handleIsoCheck = async (id, taken) => {
    const dose = taken ? parseInt(id.split('-')[1]) : 0;
    const today = new Date().toISOString().split('T')[0];
    
    // Update state immediately to make the UI responsive and avoid stale closures during await
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (taken) next.add(id);
      else next.add('iso-missed');
      return next;
    });

    await supabase.from('isotretinoin_log').upsert(
      { last_confirmed_dose_mg: dose, last_confirmed_date: today },
      { onConflict: 'last_confirmed_date' }
    );
    
    // Also record in routine_history so the day's record shows it was handled (not silently absent)
    const historyId = taken ? id : 'iso-missed';
    
    const { data: existing } = await supabase.from('routine_history')
      .select('id')
      .in('step_name', [id, 'iso-missed'])
      .eq('routine_type', 'morning')
      .gte('completed_at', today)
      .maybeSingle();

    const payload = buildPayload(historyId, 'morning');
    if (existing) payload.id = existing.id;
    
    await supabase.from('routine_history').upsert(payload);
  };

  const handleCheck = async (id) => {
    const newChecked = new Set(checkedIds);
    const isNowChecked = !newChecked.has(id);
    
    const rType = amItems.some(i => i.id === id) ? 'morning' : 'evening';
    
    if (isNowChecked) {
      newChecked.add(id);
      if (!id.startsWith('iso-')) {
        supabase.from('routine_history').insert(buildPayload(id, rType)).then();
      }
    } else {
      newChecked.delete(id);
      const today = new Date().toISOString().split('T')[0];
      if (!id.startsWith('iso-')) {
        supabase.from('routine_history')
          .delete()
          .eq('step_name', id)
          .eq('routine_type', rType)
          .gte('completed_at', today)
          .then();
      } else {
        supabase.from('isotretinoin_log').delete().eq('last_confirmed_date', today).then();
        supabase.from('routine_history')
          .delete()
          .in('step_name', [id, 'iso-missed'])
          .eq('routine_type', rType)
          .gte('completed_at', today)
          .then();
      }
    }
    setCheckedIds(newChecked);
  };

  const handleCompleteAllAm = async () => {
    setAmSaving(true);
    // Don't mark Iso as taken if they already marked it as missed
    const toSave = amItems.filter(i => !checkedIds.has(i.id) && !(i.id.startsWith('iso-') && checkedIds.has('iso-missed'))).map(i => i.id);
    if (toSave.length > 0) {
      await supabase.from('routine_history').insert(toSave.map(id => buildPayload(id, 'morning')));
      const newChecked = new Set(checkedIds);
      toSave.forEach(id => newChecked.add(id));
      setCheckedIds(newChecked);
    }
    setAmSaved(true);
    setAmSaving(false);
  };

  const handleCompleteAllPm = async () => {
    setPmSaving(true);
    const toSave = pmItems.filter(i => !checkedIds.has(i.id) && !i.isInjected).map(i => i.id);
    if (toSave.length > 0) {
      await supabase.from('routine_history').insert(toSave.map(id => buildPayload(id, 'evening')));
      const newChecked = new Set(checkedIds);
      toSave.forEach(id => newChecked.add(id));
      setCheckedIds(newChecked);
    }
    
    // The Veil: Reset flag on PM completion
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('makeup_worn_today');
    }
    
    setPmSaved(true);
    setPmSaving(false);
  };

  const handleCompleteAllLongHours = () => {
    setScheduleSaving(true);
    const LONG_HOURS_KEYS = ['The Awakening', 'The Morning Respite', 'The Midday Sustenance', 'The Afternoon Respite', 'The Descent'];
    const newChecked = new Set(scheduleChecked);
    LONG_HOURS_KEYS.forEach(k => newChecked.add(k));
    setScheduleChecked(newChecked);
    localStorage.setItem(`schedule_${todayKey}`, JSON.stringify(Array.from(newChecked)));
    setScheduleSaved(true);
    setScheduleSaving(false);
  };

  const renderScheduleStep = (time, desc, color, glyphName) => (
    <div key={time} className="step">
      <input 
        type="checkbox" 
        checked={scheduleChecked.has(time)}
        onChange={() => handleScheduleCheck(time)}
      />
      <div style={{ flex: 1 }}>
        <div className="nm" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          {glyphName && <span style={{ color: 'var(--silver)', fontSize: '1.4rem', marginRight: '0.4rem', display: 'flex', alignItems: 'center' }}><Icon name={glyphName} /></span>}
          {time} 
          <SpeakerButton text={`${time}. ${desc}`} style={{ marginLeft: '0.4rem' }} />
        </div>
        <div className="mt">{desc}</div>
      </div>
    </div>
  );

  const getDisplayName = (item) => {
    if (item.isInjected || item.category === 'immutable') return item.name;
    
    const cat = (item.category || '').toLowerCase();
    
    // Rule 15: True prescriptions must always use their explicit name and strength.
    if (item.is_prescription) return item.name;

    const isRx = item.risk_flags?.retinoid || item.name.toLowerCase().includes('tacrolimus') || item.name.toLowerCase().includes('drysol');
    if (isRx) return 'Apply Treatment (Elixir)';

    if (cat.includes('cleanser') || cat.includes('wash')) return 'Cleanse (' + cat + ')';
    if (cat.includes('toner') || cat.includes('essence') || cat.includes('mist')) return 'Tone (' + cat + ')';
    if (cat.includes('serum') || cat.includes('ampoule')) return 'Treat (' + cat + ')';
    if (cat.includes('lotion') || cat.includes('emulsion') || cat.includes('cream') || cat.includes('moisturizer')) return 'Moisturize (' + cat + ')';
    if (cat.includes('oil')) return 'Seal (' + cat + ')';
    if (cat.includes('sunscreen') || cat.includes('spf')) return 'Sun Protection (' + cat + ')';
    
    if (cat) {
      return cat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return item.name;
  };

  const renderStep = (item, isOpt = false, isRx = false, isAid = false) => {
    const rxClass = isRx ? 'rx' : '';
    const optClass = isOpt ? 'opt' : '';
    
    const displayName = getDisplayName(item);
    
    const getGlyph = (item) => {
      if (item.glyph) return item.glyph;
      if (item.name === 'The Silk Thread') return 'ph-yarn';
      if (item.name === 'The Purifying Stream') return 'ph-waves';
      if (item.name === 'The Minted Draught') return 'ph-test-tube';
      if (item.name === 'The Bristled Cleanse') return 'ph-tooth';
      if (item.name === 'The Cleansing Waters') return 'ph-shower';
      if (item.name === 'The Drying') return 'ph-towel';
      if (item.name === 'The Purging of Blemishes') return 'ph-needle';
      if (item.name === 'The Warm Gaze') return 'ph-eye-closed';
      const dom = (item.domain || '').toLowerCase();
    if (dom === 'grin') return 'tooth';
      const cat = (item.category || '').toLowerCase();
      if (cat.includes('cleanser') || cat.includes('wash')) return 'cleanser-tube';
      if (cat.includes('toner') || cat.includes('mist')) return 'toner-bottle';
      if (cat.includes('cream') || cat.includes('moisturizer')) return 'cream-jar';
      if (cat.includes('sunscreen') || cat.includes('spf')) return 'sunscreen';
      if (cat.includes('serum') || cat.includes('oil')) return 'oil-dropper';
      if (item.isRx) return 'rx-tube';
      if (dom === 'vessel') return 'body-vessel';
      if (dom === 'visage') return 'visage-face';
    if (dom === 'herbal elixirs' || dom === 'measure') return 'leaf';
      return 'sparkles'; 
    };
    
    const isIso = !isOpt && item.id.startsWith('iso-');

    const isoButtons = isIso ? (
      <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0, justifyContent: 'center', marginTop: '0.6rem', width: '100%' }}>
        {checkedIds.has(item.id) || checkedIds.has('iso-missed') ? (
          <span style={{color:'var(--silver)', fontSize:'0.9rem', fontWeight: 'bold'}}>{checkedIds.has(item.id) ? 'Taken' : 'Missed'}</span>
        ) : (
          <>
            <button className="btn plum" style={{padding:'0.4rem 0.9rem', fontSize:'0.85rem'}} onClick={() => handleIsoCheck(item.id, true)}>Took {item.expectedDose}mg</button>
            <button className="btn" style={{padding:'0.4rem 0.9rem', fontSize:'0.85rem', background: 'rgba(255,255,255,0.1)'}} onClick={() => handleIsoCheck(item.id, false)}>Missed</button>
          </>
        )}
      </div>
    ) : null;

    return (
      <div key={item.id} className={`step ${optClass}`} style={isIso ? { flexDirection: 'column', alignItems: 'stretch' } : undefined}>
        {isOpt ? (
          <label className="sw">
            <input type="checkbox" />
            <span className="sl"></span>
          </label>
        ) : isIso ? null : (
          <input 
            type="checkbox" 
            className="step-chk" 
            checked={checkedIds.has(item.id)}
            onChange={() => handleCheck(item.id)} 
          />
        )}
        <div style={{ flex: 1 }}>
          <div className={`nm ${rxClass}`} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center' }}>
            <span style={{ color: 'var(--silver)', fontSize: '1.4rem', marginRight: '0.4rem', display: 'flex', alignItems: 'center' }}><Icon name={getGlyph(item)} /></span>
            {displayName} 
            <SpeakerButton text={displayName} />
            {isAid && <span className="aid" title="Partner Assisted"><Icon name={G.tabAltars} /></span>}
          </div>
          {item.isInjected ? (
            <div className="mt" style={{opacity: 0.8}}>{item.desc}</div>
          ) : item.brand ? (
            <div className="mt">{item.brand}</div>
          ) : null}
        </div>
        {isoButtons}
      </div>
    );
  };

  return (
    <div style={{ padding: '1rem' }}>
      {healthStaleness && (
        <div style={{ textAlign: 'center', color: 'var(--silver)', opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem' }}>
          Corporeal Data as of: {healthStaleness}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start', marginTop: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Lesser Rite Banner - Full Width */}
        {suggestLesserRite && (
          <div className="card" style={{ gridColumn: '1 / -1', border: '1px solid var(--plum)', background: (useAmLesserRite && usePmLesserRite) ? 'var(--card-bg)' : 'rgba(20, 15, 25, 0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--plum)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="ph-duotone ph-star" style={{fontSize: '1.2em'}}></i> The Lesser Rite is Recommended
                </h3>
                <div style={{ opacity: 0.8, marginTop: '0.5rem' }}>Your corporeal readiness is low today. The spirits advise rest.</div>
              </div>
              <button className={`btn ${(useAmLesserRite && usePmLesserRite) ? 'plum' : 'g'}`} onClick={() => {
                const nextVal = !(useAmLesserRite && usePmLesserRite);
                setUseAmLesserRite(nextVal);
                setUsePmLesserRite(nextVal);
              }} style={{ padding: '0.8rem 1.5rem', fontSize: '1.1rem' }}>
                {(useAmLesserRite && usePmLesserRite) ? 'Restore Full Rites' : 'Invoke the Lesser Rite'}
              </button>
            </div>
          </div>
        )}
        
        {/* Left Column: Morning Invocation */}
        <div className="card">
          <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="ph-duotone ph-sun"></i> The Morning Invocation <SpeakerButton text='The Morning Invocation' />
            </h3>
            <button className={`btn ${useAmLesserRite ? 'plum' : 'g'}`} onClick={() => setUseAmLesserRite(!useAmLesserRite)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
              {useAmLesserRite ? 'Full' : 'Lesser'}
            </button>
          </div>
          {activeAmItems.length > 0 && (
            <div style={{ margin: '0.5rem 0 1rem 0', textAlign: 'center' }}>
              <button 
                className={`btn ${amSaved || activeAmItems.every(i => checkedIds.has(i.id) || (i.id.startsWith('iso-') && checkedIds.has('iso-missed'))) ? 'g' : 'plum'}`} 
                style={{ fontSize: '1rem', padding: '0.6rem 1.5rem', width: '100%' }}
                onClick={handleCompleteAllAm}
                disabled={amSaving || amSaved || activeAmItems.every(i => checkedIds.has(i.id) || (i.id.startsWith('iso-') && checkedIds.has('iso-missed')))}
              >
                {amSaving ? 'Consecrating...' : (amSaved || activeAmItems.every(i => checkedIds.has(i.id) || (i.id.startsWith('iso-') && checkedIds.has('iso-missed'))) ? 'The Morning Altar is Consecrated' : 'Consecrate the Morning Altar')}
              </button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activeAmItems.length > 0 ? activeAmItems.map(i => renderStep(i)) : <div className="empty">The altar is bare. No morning rites are required.</div>}
          </div>
        </div>

        {/* Center Column: The Long Hours */}
        <div className="card">
          <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
            <i className="ph-duotone ph-hourglass"></i> The Long Hours <SpeakerButton text='The Long Hours' />
          </h3>
          <div style={{ margin: '0.5rem 0 1rem 0', textAlign: 'center' }}>
            <button 
              className={`btn ${scheduleSaved || ['The Awakening', 'The Morning Respite', 'The Midday Sustenance', 'The Afternoon Respite', 'The Descent'].every(i => scheduleChecked.has(i)) ? 'g' : 'plum'}`} 
              style={{ fontSize: '1rem', padding: '0.6rem 1.5rem', width: '100%' }}
              onClick={handleCompleteAllLongHours}
              disabled={scheduleSaving || scheduleSaved || ['The Awakening', 'The Morning Respite', 'The Midday Sustenance', 'The Afternoon Respite', 'The Descent'].every(i => scheduleChecked.has(i))}
            >
              {scheduleSaving ? 'Consecrating...' : (scheduleSaved || ['The Awakening', 'The Morning Respite', 'The Midday Sustenance', 'The Afternoon Respite', 'The Descent'].every(i => scheduleChecked.has(i)) ? 'The Long Hours are Consecrated' : 'Consecrate the Long Hours')}
            </button>
          </div>
          <div className="mt mb-4" style={{ textAlign: 'center' }}>The Order of the Day</div>
          
          {renderScheduleStep('The Awakening', 'Allow 5 to 10 minutes for the veil of sleep to lift.', 'var(--crimson-b)', 'ph-cloud-sun')}
          {renderScheduleStep('The Morning Respite', 'A 15-minute sanctuary. Imbibe 16 ounces of pure water.', 'var(--plum)', 'ph-coffee')}
          {renderScheduleStep('The Midday Sustenance', 'A 45-minute pause for nourishment. Engage in gentle movement to stir stagnant energies.', 'var(--plum)', 'ph-fork-knife')}
          {renderScheduleStep('The Afternoon Respite', 'A 15-minute sanctuary. Imbibe 16 ounces of pure water.', 'var(--plum)', 'ph-mug')}
          {renderScheduleStep('The Descent', 'The day\'s labors conclude. Begin the grounding process to sever ties with the work.', 'var(--plum)', 'ph-bed')}
        </div>

        {/* Right Column: Evening Invocation */}
        <div className="card">
          <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="ph-duotone ph-moon"></i> The Evening Invocation <SpeakerButton text='The Evening Invocation' />
            </h3>
            <button className={`btn ${usePmLesserRite ? 'plum' : 'g'}`} onClick={() => setUsePmLesserRite(!usePmLesserRite)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
              {usePmLesserRite ? 'Full' : 'Lesser'}
            </button>
          </div>
          {activePmItems.length > 0 && (
            <div style={{ margin: '0.5rem 0 1rem 0', textAlign: 'center' }}>
              <button 
                className={`btn ${pmSaved || activePmItems.every(i => checkedIds.has(i.id)) ? 'g' : 'plum'}`} 
                style={{ fontSize: '1rem', padding: '0.6rem 1.5rem', width: '100%' }}
                onClick={handleCompleteAllPm}
                disabled={pmSaving || pmSaved || activePmItems.every(i => checkedIds.has(i.id))}
              >
                {pmSaved || activePmItems.every(i => checkedIds.has(i.id)) ? 'The Altar is Consecrated' : 'Consecrate the Evening Altar'}
              </button>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activePmItems.length > 0 ? activePmItems.map(i => renderStep(i)) : <div className="empty">The altar is bare. No evening rites are required.</div>}
          </div>
        </div>
        
      </div>

      {/* Keeper's Warning (Full Width Below) */}
      {conflicts.length > 0 && (
        <div className="card mt-4" style={{ background: 'var(--card-bg-alt, rgba(100,20,20,0.5))', borderColor: '#882222' }}>
          <h3 style={{ color: 'var(--plum)', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
            <i className="ph-duotone ph-warning"></i> The Keeper's Warning <SpeakerButton text="The Keeper's Warning" />
          </h3>
          <ul style={{ marginTop: '0.5rem', color: 'var(--plum)', paddingLeft: '1.5rem' }}>
            {conflicts.map((c, idx) => (
              <li key={idx}>
                {c} <SpeakerButton text={c} style={{ marginLeft: '0.4rem', verticalAlign: 'middle' }} />
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
