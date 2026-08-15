import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { G } from '../lib/icons.jsx';
import Icon from '../components/Icon.jsx';
import { evaluateScryingPool, parseProductImage } from '../lib/ai-engine.js';
import { getReadiness } from '../lib/health-connect.js';
import { fetchHydratedItems } from '../lib/routine-engine.js';
import VoiceInput from '../components/VoiceInput.jsx';
import { useDialog } from '../components/Dialogs.jsx';
import SpeakerButton from '../components/SpeakerButton.jsx';

export default function Scrying({ pose }) {
  const { alert, confirm } = useDialog();
  const [inventory, setInventory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [healthEnabled, setHealthEnabled] = useState(false);
  const [scryStatus, setScryStatus] = useState('');
  const [scryResult, setScryResult] = useState('');
  const [reactionForm, setReactionForm] = useState({
    productId: '',
    zone: 'The visage, below — jaw and chin',
    reactions: new Set(),
    severity: 0
  });
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [evaluationStatus, setEvaluationStatus] = useState('');
  const [evaluationResult, setEvaluationResult] = useState('');
  const [editId, setEditId] = useState(null);
  const reactionOptions = ['Peeling', 'Redness', 'Burning', 'Itching', 'Purging', 'Dryness', 'Darkening where it healed'];
  const zoneOptions = [
    'The visage, below — jaw and chin',
    'The visage, midway — nose and cheek',
    'The gaze — lid and orbit',
    'The crown — scalp',
    'The grin — mouth, teeth, gums',
    'The veil — face (makeup)',
    'The vessel — underarm',
    'The vessel — chest and back',
    'The vessel — arms and legs',
    'The vessel — hands and feet',
    'The vessel — general body'
  ];
  useEffect(() => {
    async function fetchData() {
      const items = await fetchHydratedItems();
      setInventory(items || []);
      
      const { data: userProfile } = await supabase.from('user_profile').select('*').maybeSingle();
      setProfile(userProfile);

      const { data: reactions } = await supabase.from('somatic_reactions').select('*, items(name, brand)');
      const formattedLedger = (reactions || []).map(r => ({
        id: r.id,
        productId: r.item_id,
        zone: r.zone,
        severity: r.severity,
        reactions: r.symptoms || [],
        productName: r.items?.name || 'Unknown',
        brand: r.items?.brand || '',
        date: r.created_at
      }));
      setLedgerEntries(formattedLedger);
    }
    fetchData();

    const settingsStr = localStorage.getItem('app_settings');
    const settings = settingsStr ? JSON.parse(settingsStr) : {};
    
    if (settings.health) {
      setHealthEnabled(true);
      getReadiness().then(res => {
        if (res) setReadiness(res);
      }).catch(console.error);
    }
  }, []);


  const now = new Date();

  const toggleReaction = (reaction) => {
    setReactionForm(prev => {
      const next = new Set(prev.reactions);
      if (next.has(reaction)) next.delete(reaction);
      else next.add(reaction);
      return { ...prev, reactions: next };
    });
  };

  const handleSaveLedger = async () => {
    if (!profile) return;
    try {
      let result;
      if (editId) {
        result = await supabase.from('somatic_reactions').update({
          item_id: reactionForm.productId,
          zone: reactionForm.zone,
          severity: String(reactionForm.severity),
          symptoms: Array.from(reactionForm.reactions),
          reaction_type: 'adverse_reaction'
        }).eq('id', editId).select().maybeSingle();
      } else {
        result = await supabase.from('somatic_reactions').insert({
          item_id: reactionForm.productId,
          zone: reactionForm.zone,
          severity: String(reactionForm.severity),
          symptoms: Array.from(reactionForm.reactions),
          reaction_type: 'adverse_reaction'
        }).select().maybeSingle();
      }
      const { error, data } = result;

      if (error) throw error;
      if (!data) throw new Error('Failed to record reaction.');
      
      const item = inventory.find(i => i.id === reactionForm.productId);
      const newEntry = {
        id: data.id,
        productId: reactionForm.productId,
        productName: item ? item.name : 'Unknown',
        brand: item ? item.brand : '',
        zone: reactionForm.zone,
        reactions: Array.from(reactionForm.reactions),
        severity: reactionForm.severity,
        date: data.created_at
      };
      
      if (editId) {
        setLedgerEntries(prev => prev.map(e => e.id === editId ? newEntry : e));
      } else {
        setLedgerEntries(prev => [...prev, newEntry]);
      }
      setReactionForm({ productId: '', zone: 'The visage, below — jaw and chin', reactions: new Set(), severity: 0 });
      setEditId(null);
    } catch (err) {
      console.error(err);
      await alert('Failed to save to ledger.');
    }
  };

  const handleEditLedger = (entry) => {
    setEditId(entry.id);
    setReactionForm({
      productId: entry.productId,
      zone: entry.zone,
      reactions: new Set(entry.reactions),
      severity: entry.severity
    });
  };

  const handleDeleteLedger = async (id, index) => {
    if (await confirm("Erase this affliction from the ledger?")) {
      if (id) {
        await supabase.from('somatic_reactions').delete().eq('id', id);
      }
      setLedgerEntries(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDivineAfflictions = async () => {
    setEvaluationStatus('The Pool stirs... seeking truth in the water...');
    setEvaluationResult('');
    
    try {
      const { generateScryingEvaluation } = await import('../lib/ai-engine.js');
      // Pass the entire ecosystem
      const reply = await generateScryingEvaluation(inventory, banishedItems, ledgerEntries, profile?.intake_answers || {});
      setEvaluationStatus('');
      setEvaluationResult(reply);
    } catch (err) {
      console.error(err);
      setEvaluationStatus('The Pool is clouded. ' + err.message);
    }
  };

  const allergies = profile?.intake_answers?.conditions?.filter(c => c.type === 'allergy') || [];
  const banishedItems = inventory.filter(i => i.lifecycle_state === 'banished');

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <div className="card mt-4" style={{ height: '100%', padding: '1.5rem', textAlign: 'center' }}>
          <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
          <h3 style={{ margin: '0 0 0.5rem 0', justifyContent: 'center' }}><span className="g"><Icon name={G.tabPool}/></span>What the Water Shows <SpeakerButton text="What the Water Shows" /></h3>
          <div className="mt" style={{ marginBottom: '1rem', textAlign: 'center' }}>A holistic divination of your routine, reactions, and trajectory.</div>
          
          <button className="btn full plum" onClick={handleDivineAfflictions}>Divine Afflictions</button>
          
          <div style={{ marginTop: '1rem', fontSize: '1rem', color: 'var(--plum)', minHeight: '1rem', }}>
            {evaluationStatus}
          </div>
          <div style={{ marginTop: '1rem', fontSize: '1.1rem', lineHeight: 1.5, color: 'var(--plum)', whiteSpace: 'pre-wrap' }}>
            {evaluationResult || <div className="empty" style={{textAlign: 'center', margin: 0}}>The water is still. Summon your relics, then seek the water's counsel.</div>}
          </div>
        </div>

        <div className="card mt-4" style={{ height: '100%', padding: '1.5rem', textAlign: 'center' }}>
        <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
        <h3 style={{ margin: '0 0 0.5rem 0', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <i className="ph-duotone ph-book-bookmark"></i> The Ledger of Afflictions <SpeakerButton text="The Ledger of Afflictions" />
        </h3>
        <div className="mt" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Has something turned against you? Speak of it — what, and where, and how sorely.</div>
        
        {inventory.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="field">
              <label>The Offending Elixir</label>
              <select value={reactionForm.productId} onChange={(e) => setReactionForm({...reactionForm, productId: e.target.value})} style={{width: '100%'}}>
                <option value="">Select a formula...</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            
            <div className="field">
              <label>The Afflicted Realm</label>
              <select value={reactionForm.zone} onChange={(e) => setReactionForm({...reactionForm, zone: e.target.value})} style={{width: '100%'}}>
                {zoneOptions.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>

            <div className="field">
              <label>The Manifestation</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {reactionOptions.map(r => {
                  const isChecked = reactionForm.reactions.has(r);
                  return (
                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', cursor: 'pointer', color: isChecked ? 'var(--plum)' : 'var(--dim)' }}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleReaction(r)} style={{ display: 'none' }} />
                      <div style={{ padding: '0.2rem 0.5rem', border: `1px solid ${isChecked ? 'var(--plum)' : 'var(--border)'}`, borderRadius: '12px', background: isChecked ? 'rgba(176,132,148,0.2)' : 'transparent' }}>
                        {r}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label>The Weight of the Affliction (1-5)</label>
              <div className="chips" style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button 
                    key={n} 
                    className={`chip ${reactionForm.severity === n ? 'on' : ''}`}
                    onClick={() => setReactionForm({...reactionForm, severity: n})}
                    style={{ minWidth: '40px', padding: '0.5rem' }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            
            <button className="btn plum" onClick={handleSaveLedger} disabled={!reactionForm.productId || reactionForm.reactions.size === 0 || reactionForm.severity === 0}>
              {editId ? 'Update the water' : 'Give it to the water'}
            </button>
            {editId && <button className="btn" onClick={() => { setEditId(null); setReactionForm({ productId: '', zone: 'The visage, below — jaw and chin', reactions: new Set(), severity: 0 }); }}>Release</button>}
          </div>
        ) : (
          <div className="empty">Your apothecary stands empty. Summon relics to record afflictions.</div>
        )}

        {ledgerEntries.length > 0 && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <h4 style={{ color: 'var(--metal)', marginBottom: '1rem' }}>Chamber Ledger of Ills</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ledgerEntries.map((entry, idx) => (
                <div key={idx} className="row" style={{ opacity: 0.8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="nm" style={{ color: 'var(--plum)' }}>{entry.productName}</div>
                    <div className="mt">{entry.zone} &bull; Affliction Rank: {entry.severity}/5</div>
                    <div className="mt" style={{ marginTop: '0.3rem' }}>{entry.reactions.join(', ')}</div>
                  </div>
                  <div>
                    <button className="btn sm" onClick={() => handleEditLedger(entry)} style={{ border: '1px solid var(--silver)', color: 'var(--silver)', marginRight: '0.5rem' }}>
                      Alter
                    </button>
                    <button className="btn sm" onClick={() => handleDeleteLedger(entry.id, idx)} style={{ border: '1px solid var(--plum)', color: 'var(--plum)' }}>
                      Banish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <div className="card mt-4" style={{ height: '100%', padding: '1.5rem', textAlign: 'center' }}>
        <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
        <h3 style={{ margin: '0 0 0.5rem 0', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <i className="ph-duotone ph-fire"></i> The Crypt of Ashes <SpeakerButton text="The Crypt of Ashes" />
        </h3>
        <div className="mt" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Elements forever sealed away.</div>
        <div>
          {allergies.length > 0 || banishedItems.length > 0 ? (
            <>
              {allergies.map((a, i) => (
                <div key={`allergy-${i}`} className="row" style={{ opacity: 0.8 }}>
                  <div style={{ flex: 1 }}>
                    <div className="nm" style={{ color: 'var(--plum)' }}>{a.value}</div>
                    <div className="mt">Allergy / Sensitivity</div>
                  </div>
                </div>
              ))}
              {banishedItems.map((item, i) => (
                <div key={`banished-${i}`} className="row" style={{ opacity: 0.8 }}>
                  <div style={{ flex: 1 }}>
                    <div className="nm" style={{ color: 'var(--plum)' }}>{item.name}</div>
                    <div className="mt">{item.brand} &bull; Banished</div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="empty">No formulas linger in the ashes. The crypt slumbers.</div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}

