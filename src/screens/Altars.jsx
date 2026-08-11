import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { G } from '../lib/icons.jsx';
import Icon from '../components/Icon.jsx';
import SpeakerButton from '../components/SpeakerButton.jsx';
import { buildBaseRoutines, fetchHydratedItems, filterLesserRite } from '../lib/routine-engine.js';

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const buildPayload = (id, rType) => ({
  completed_at: new Date().toISOString(),
  routine_type: rType,
  step_name: id,
  ...(isUUID(id) ? { item_id: id } : {})
});

const ALTARS = [
  { id: 'crown', name: 'Crown', icon: G.crown },
  { id: 'gaze', name: 'Gaze', icon: G.gaze },
  { id: 'grin', name: 'Grin', icon: G.grin },
  { id: 'visage', name: 'Visage', icon: G.visage },
  { id: 'vessel', name: 'Vessel', icon: G.vessel },
  { id: 'veil', name: 'Veil', icon: G.veil },
  { id: 'steeping', name: 'Steeping', icon: G.steeping },
];



export default function Altars({ pose }) {
  const [activeAltarId, setActiveAltarId] = useState('crown');
  const [displayedAltar, setDisplayedAltar] = useState('Crown');
  const [opacity, setOpacity] = useState(1);
  const [items, setItems] = useState([]);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [checkedRoutineTypes, setCheckedRoutineTypes] = useState({});
  const [lesserRites, setLesserRites] = useState({});
  
  useEffect(() => {
    fetchHydratedItems(['stocked', 'ebbing', 'enshrined']).then(data => {
      if (data) setItems(data);
    });
  }, []);

  const handleTabClick = (id, name) => {
    if (activeAltarId === id) return;
    setActiveAltarId(id);
    setOpacity(0);
    setTimeout(() => {
      setDisplayedAltar(name);
      setOpacity(1);
    }, 150);
  };

  const handleCheck = (id) => {
    const next = new Set(checkedIds);
    if (next.has(id)) {
      next.delete(id);
      const today = new Date().toISOString().split('T')[0];
      const rType = checkedRoutineTypes[id] || (new Date().getHours() < 17 ? 'morning' : 'evening');
      supabase.from('routine_history')
        .delete()
        .eq('step_name', id)
        .eq('routine_type', rType)
        .gte('completed_at', today)
        .then();
        
      setCheckedRoutineTypes(prev => {
        const p = { ...prev };
        delete p[id];
        return p;
      });
    } else {
      next.add(id);
      const rType = new Date().getHours() < 17 ? 'morning' : 'evening';
      supabase.from('routine_history').insert(buildPayload(id, rType)).then();
      setCheckedRoutineTypes(prev => ({ ...prev, [id]: rType }));
      
      // The Veil: Trigger Mandatory Removal Mechanism
      const checkedItem = items.find(i => i.id === id);
      if (checkedItem) {
        let isVeil = (checkedItem.domain || '').toLowerCase() === 'veil';
        if (!isVeil && checkedItem.item_type === 'composite' && checkedItem.composite_components) {
          const components = checkedItem.composite_components.map(cc => cc.items).filter(Boolean);
          isVeil = components.some(c => (c.domain || '').toLowerCase() === 'veil');
        }
        if (isVeil && typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('makeup_worn_today', 'true');
        }
      }
    }
    setCheckedIds(next);
  };

  const getGlyph = (item) => {
    if (item.glyph) return item.glyph;
    const dom = (item.domain || '').toLowerCase();
    if (dom === 'grin') return 'tooth';
    const cat = (item.category || '').toLowerCase();
    if (cat.includes('cleanser') || cat.includes('wash')) return 'cleanser-tube';
    if (cat.includes('toner') || cat.includes('mist')) return 'toner-bottle';
    if (cat.includes('cream') || cat.includes('moisturizer')) return 'cream-jar';
    if (cat.includes('sunscreen') || cat.includes('spf')) return 'sunscreen';
    if (cat.includes('serum') || cat.includes('oil')) return 'oil-dropper';
    if (dom === 'vessel') return 'body-vessel';
    if (dom === 'visage') return 'visage-face';
    if (dom === 'crown') return 'crown';
    if (dom === 'steeping' || dom === 'herbal elixirs') return 'leaf';
    if (dom === 'measure') return 'leaf'; // Using leaf or sparkles as fallback for now
    return 'sparkles'; 
  };

  const renderStep = (item, isOpt = false, isAid = false) => (
    <div key={item.id} className={`step ${isOpt ? 'opt' : ''}`}>
      {isOpt ? (
        <label className="sw">
          <input type="checkbox" />
          <span className="sl"></span>
        </label>
      ) : (
        <input type="checkbox" className="step-chk" checked={checkedIds.has(item.id)} onChange={() => handleCheck(item.id)} />
      )}
      <div style={{ flex: 1 }}>
        <div className="nm" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ color: 'var(--silver)', fontSize: '1.2em', marginRight: '0.4rem', display: 'flex', alignItems: 'center' }}><Icon name={getGlyph(item)} /></span>
          {item.name} 
          <span style={{ marginLeft: '0.4rem', display: 'flex', alignItems: 'center' }}><SpeakerButton text={item.name} /></span>
          {isAid && <span className="aid" title="Partner Assisted"><Icon name={G.tabAltars} /></span>}
        </div>
        <div className="mt">{item.brand ? `${item.brand} ` : ''}{item.desc ? `• ${item.desc}` : ''}</div>
      </div>
    </div>
  );

  const renderAltarContent = () => {
    // Sort items by weight using engine logic
    const { getWeight } = buildBaseRoutines(items, {});
    let domainItems = items
      .filter(i => (i.domain || '').toLowerCase() === activeAltarId)
      .sort((a, b) => getWeight(a) - getWeight(b));

    if (lesserRites[activeAltarId]) {
      domainItems = filterLesserRite(domainItems);
    }

    if (domainItems.length === 0) {
      return <div className="mt mb-4">No rites currently summoned for this domain. The shelves are bare.</div>;
    }

    const renderRhythm = (rhythmName, itemsInRhythm) => {
      if (itemsInRhythm.length === 0) return null;
      return (
        <div style={{ marginBottom: '2rem' }}>
          <div className="mt mb-4" style={{ textAlign: 'center', color: 'var(--plum)', fontWeight: 'bold' }}>{rhythmName}</div>
          <div style={{ margin: '0.5rem 0 1rem 0', textAlign: 'center' }}>
            <button 
              className={`btn full ${itemsInRhythm.every(i => checkedIds.has(i.id)) ? 'g' : 'plum'}`} 
              onClick={() => {
                const toSave = itemsInRhythm.filter(i => !checkedIds.has(i.id)).map(i => i.id);
                if (toSave.length > 0) {
                  const rType = new Date().getHours() < 17 ? 'morning' : 'evening';
                  supabase.from('routine_history').insert(toSave.map(id => buildPayload(id, rType))).then();
                  const nextChecked = new Set(checkedIds);
                  const nextTypes = { ...checkedRoutineTypes };
                  toSave.forEach(id => {
                    nextChecked.add(id);
                    nextTypes[id] = rType;
                  });
                  setCheckedIds(nextChecked);
                  setCheckedRoutineTypes(nextTypes);
                  
                  // The Veil: Trigger Mandatory Removal Mechanism
                  let veilTriggered = false;
                  toSave.forEach(id => {
                    const checkedItem = items.find(i => i.id === id);
                    if (checkedItem) {
                      if ((checkedItem.domain || '').toLowerCase() === 'veil') veilTriggered = true;
                      if (checkedItem.item_type === 'composite' && checkedItem.composite_components) {
                        const components = checkedItem.composite_components.map(cc => cc.items).filter(Boolean);
                        if (components.some(c => (c.domain || '').toLowerCase() === 'veil')) veilTriggered = true;
                      }
                    }
                  });
                  if (veilTriggered && typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem('makeup_worn_today', 'true');
                  }
                }
              }}
              disabled={itemsInRhythm.every(i => checkedIds.has(i.id))}
            >
              {itemsInRhythm.every(i => checkedIds.has(i.id)) ? 'Consecrated' : 'Consecrate'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {itemsInRhythm.map(i => {
              const isOpt = i.category?.toLowerCase().includes('mask') || i.category?.toLowerCase().includes('treatment');
              return renderStep(i, isOpt);
            })}
          </div>
        </div>
      );
    };

    if (activeAltarId === 'crown') {
      const washDayItems = domainItems.filter(i => {
        const c = (i.category || '').toLowerCase();
        return c.includes('shampoo') || c.includes('wash') || c.includes('cleanse') || c.includes('deep condition') || c.includes('mask') || c.includes('treatment');
      });
      const dailyItems = domainItems.filter(i => !washDayItems.includes(i));
      
      return (
        <div>
          {renderRhythm('Wash Day', washDayItems)}
          {renderRhythm('Daily Maintenance', dailyItems)}
        </div>
      );
    }

    if (activeAltarId === 'vessel') {
      const bathRitualItems = domainItems.filter(i => {
        const c = (i.category || '').toLowerCase();
        const n = (i.name || '').toLowerCase();
        return c.includes('soak') || c.includes('salt') || c.includes('milk') || c.includes('scrub') || n.includes('bath');
      });
      const dailyItems = domainItems.filter(i => !bathRitualItems.includes(i));
      
      return (
        <div>
          {renderRhythm('Daily Maintenance', dailyItems)}
          {renderRhythm('The Bath Ritual', bathRitualItems)}
        </div>
      );
    }

    return (
      <div>
        {renderRhythm('The Liturgy of Sequence', domainItems)}
      </div>
    );
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      <div className="sub" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '0.8rem', width: '100%' }}>
        {ALTARS.map(altar => (
          <button
            key={altar.id}
            className={`btn ${activeAltarId === altar.id ? 'active' : ''}`}
            onClick={() => handleTabClick(altar.id, altar.name)}
          >
            <Icon name={altar.icon} /> {`The ${altar.name}`}
          </button>
        ))}
      </div>
      
      <div className="card" style={{ width: '100%', minHeight: '300px', transition: 'opacity 0.3s ease', opacity }}>
        <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>The {displayedAltar} <SpeakerButton text={`The ${displayedAltar}`} /></h3>
          <button 
            className={`btn ${lesserRites[activeAltarId] ? 'plum' : 'g'}`} 
            onClick={() => setLesserRites(prev => ({...prev, [activeAltarId]: !prev[activeAltarId]}))}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
          >
            {lesserRites[activeAltarId] ? 'Full' : 'Lesser'}
          </button>
        </div>
        {renderAltarContent()}
      </div>
    </div>
  );
}
