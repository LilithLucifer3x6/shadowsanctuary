import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import Icon from '../components/Icon.jsx';
import { G } from '../lib/icons.jsx';
import SpeakerButton from '../components/SpeakerButton.jsx';
import VoiceInput from '../components/VoiceInput.jsx';

export default function Intake({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 16;
  const [ans, setAns] = useState({
    sunExposure: '',
    sensitivity: '',
    fragrance: '',
    hairType: '',
    coilyDetails: [],
    porosity: '',
    scalpOil: '',
    eyes: [],
    mouth: [],
    bodyHair: '',
    nails: [],
    makeup: '',
    timeBudget: '',
    sweat: '',
    skinTone: '',
    concerns: {},
    rxList: [],
    oralList: [],
    algList: [],
    conditions: []
  });

  const updateAns = (k, v) => setAns(prev => ({ ...prev, [k]: v }));
  
  const toggleMulti = (k, val) => {
    setAns(prev => {
      const arr = prev[k] || [];
      if (arr.includes(val)) return { ...prev, [k]: arr.filter(x => x !== val) };
      return { ...prev, [k]: [...arr, val] };
    });
  };

  const handleFinish = async () => {
    const avatarConfig = JSON.parse(localStorage.getItem('avatar_config') || '{}');
    const { data: existing } = await supabase.from('user_profile').select('id').maybeSingle();
    const profileData = {
      intake_completed: true,
      intake_answers: ans,
      avatar_config: avatarConfig
    };
    if (existing) await supabase.from('user_profile').update(profileData).eq('id', existing.id);
    else await supabase.from('user_profile').insert([profileData]);
    
    localStorage.setItem('intake_completed', 'true');
    onComplete();
  };

  const renderTitle = (titleText) => (
    <h3>{titleText} <SpeakerButton text={titleText} /></h3>
  );

  return (
    <div className="card" style={{ width: '100%', maxWidth: '960px', minHeight: '400px', margin: '2rem auto', display: 'flex', flexDirection: 'column' }}>
      <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
      
      <div style={{ flexShrink: 0 }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', color: 'var(--plum)' }}>
          <Icon name={G.sparkles || 'sparkles'} /> The Rite of Naming
        </h2>
      </div>

      <div id="ins-steps" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
        {currentStep === 1 && (
          <div className="ins-step">
            {renderTitle('Sun & Environmental Exposure')}
            <div className="mt">How much sun and elemental exposure do you face daily?</div>
            <div className="chips mt-4">
              {['Minimal (Mostly indoors)', 'Moderate (Commuting, short walks)', 'High (Outdoor work, sports)', 'Intense (Equatorial/High Altitude)'].map(opt => (
                <div key={opt} className={`chip ${ans.sunExposure === opt ? 'on' : ''}`} onClick={() => updateAns('sunExposure', opt)}>{opt}</div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="ins-step">
            {renderTitle('Skin Sensitivity & Melanin')}
            <div className="mt">How does your skin react to the elements and new products?</div>
            <div className="chips mt-4">
              {['Resilient (Rarely reacts)', 'Reactive (Redness, stinging)', 'Sensitized (Damaged barrier)', 'I don\'t know'].map(opt => (
                <div key={opt} className={`chip ${ans.sensitivity === opt ? 'on' : ''}`} onClick={() => updateAns('sensitivity', opt)}>{opt}</div>
              ))}
            </div>
            <div className="mt mt-4">What is your skin tone? (For melanin-specific wards)</div>
            <div className="chips mt-4">
              {['Type I-II (Fair/Light)', 'Type III-IV (Medium/Olive)', 'Type V-VI (Brown/Deep)'].map(opt => (
                <div key={opt} className={`chip ${ans.skinTone === opt ? 'on' : ''}`} onClick={() => updateAns('skinTone', opt)}>{opt}</div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="ins-step">
            {renderTitle('Fragrance Preference')}
            <div className="mt">Are you seeking aromatics, or strictly neutral formulations?</div>
            <div className="chips mt-4">
              {['I prefer fragrance', 'I prefer unscented/neutral', 'I have no preference'].map(opt => (
                <div key={opt} className={`chip ${ans.fragrance === opt ? 'on' : ''}`} onClick={() => updateAns('fragrance', opt)}>{opt}</div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="ins-step">
            {renderTitle('The Crown: Hair Type')}
            <div className="mt">How does your hair naturally fall?</div>
            <div className="chips mt-4">
              {['1A-1C (Straight)', '2A-2C (Wavy)', '3A-3C (Curly)', '4A-4C (Coily/Kinky)', 'I don\'t know'].map(opt => (
                <div key={opt} className={`chip ${ans.hairType === opt ? 'on' : ''}`} onClick={() => updateAns('hairType', opt)}>{opt}</div>
              ))}
            </div>
            {ans.hairType && ans.hairType.includes('4') && (
              <div className="mt-4 p-4" style={{border: '1px solid var(--border)', borderRadius: '8px'}}>
                <div className="mt">For Coily/Kinky textures: Are your coils...</div>
                <div className="chips mt-4">
                  {['High Density (Thick)', 'Low Density (Fine)', 'Locs', 'Protective Styles often'].map(opt => (
                    <div key={opt} className={`chip ${ans.coilyDetails.includes(opt) ? 'on' : ''}`} onClick={() => toggleMulti('coilyDetails', opt)}>{opt}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 5 && (
          <div className="ins-step">
            {renderTitle('The Crown: Porosity & Scalp')}
            <div className="mt">How does your hair drink moisture?</div>
            <div className="chips mt-4">
              {['Low (Repels water)', 'Medium (Absorbs normally)', 'High (Absorbs quickly, dries fast)', 'I don\'t know'].map(opt => (
                <div key={opt} className={`chip ${ans.porosity === opt ? 'on' : ''}`} onClick={() => updateAns('porosity', opt)}>{opt}</div>
              ))}
            </div>
            {ans.porosity === 'I don\'t know' && (
              <div className="mt-4 p-4" style={{border: '1px solid var(--gold)', borderRadius: '8px', color: 'var(--silver)'}}>
                <strong>The Spray/Mist Test:</strong> Mist a section of dry, clean hair with water. If it beads up and sits on top, it's Low. If it absorbs immediately, it's High.
              </div>
            )}
            <div className="mt mt-4">How does your scalp fare?</div>
            <div className="chips mt-4">
              {['Dry / Flaky', 'Balanced', 'Oily', 'I don\'t know'].map(opt => (
                <div key={opt} className={`chip ${ans.scalpOil === opt ? 'on' : ''}`} onClick={() => updateAns('scalpOil', opt)}>{opt}</div>
              ))}
            </div>
            {ans.scalpOil === 'I don\'t know' && (
              <div className="mt-4 p-4" style={{border: '1px solid var(--gold)', borderRadius: '8px', color: 'var(--silver)'}}>
                <strong>The Blotting Paper Test:</strong> 24 hours after washing, press a blotting paper to your scalp. If it's translucent, you're Oily. If dry, you're Dry.
              </div>
            )}
          </div>
        )}

        {currentStep === 6 && (
          <div className="ins-step">
            {renderTitle('Gaze & Grin: Eyes & Mouth')}
            <div className="mt">What is the state of your Gaze? (Select all that apply)</div>
            <div className="chips mt-4">
              {['Dark Circles', 'Puffiness', 'Dryness / Irritation', 'Fine Lines', 'None'].map(opt => (
                <div key={opt} className={`chip ${ans.eyes.includes(opt) ? 'on' : ''}`} onClick={() => toggleMulti('eyes', opt)}>{opt}</div>
              ))}
            </div>
            <div className="mt mt-4">What is the state of your Grin? (Select all that apply)</div>
            <div className="chips mt-4">
              {['Chapped Lips', 'Enamel Sensitivity', 'Gums Bleed Easily', 'None'].map(opt => (
                <div key={opt} className={`chip ${ans.mouth.includes(opt) ? 'on' : ''}`} onClick={() => toggleMulti('mouth', opt)}>{opt}</div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="ins-step">
            {renderTitle('Vessel: Body Hair & Nails')}
            <div className="mt">What is your approach to body hair?</div>
            <div className="chips mt-4">
              {['Shave regularly', 'Wax/Sugaring', 'Depilatory creams', 'Laser/Electrolysis', 'Leave natural'].map(opt => (
                <div key={opt} className={`chip ${ans.bodyHair === opt ? 'on' : ''}`} onClick={() => updateAns('bodyHair', opt)}>{opt}</div>
              ))}
            </div>
            <div className="mt mt-4">What is the state of your Nails? (Select all that apply)</div>
            <div className="chips mt-4">
              {['Brittle/Peeling', 'Ridges', 'Cuticle Dryness', 'Acrylics/Gels Often', 'Healthy/Natural'].map(opt => (
                <div key={opt} className={`chip ${ans.nails.includes(opt) ? 'on' : ''}`} onClick={() => toggleMulti('nails', opt)}>{opt}</div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 8 && (
          <div className="ins-step">
            {renderTitle('Habits: Makeup & Sweat')}
            <div className="mt">How often do you wear the Veil (makeup)?</div>
            <div className="chips mt-4">
              {['Daily heavy makeup', 'Daily light/natural', 'Occasionally', 'Never'].map(opt => (
                <div key={opt} className={`chip ${ans.makeup === opt ? 'on' : ''}`} onClick={() => updateAns('makeup', opt)}>{opt}</div>
              ))}
            </div>
            <div className="mt mt-4">How frequently do you engage in heavy sweat/exercise?</div>
            <div className="chips mt-4">
              {['Daily', '3-4 times a week', 'Rarely', 'Never'].map(opt => (
                <div key={opt} className={`chip ${ans.sweat === opt ? 'on' : ''}`} onClick={() => updateAns('sweat', opt)}>{opt}</div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 9 && (
          <div className="ins-step">
            {renderTitle('Time & Devotion')}
            <div className="mt">What is your time budget for the Rites?</div>
            <div className="chips mt-4">
              {['Minimal (5 mins, absolute basics)', 'Moderate (10-15 mins, balanced)', 'Elaborate (20+ mins, full ritual)', 'Variable (Depends on the day)'].map(opt => (
                <div key={opt} className={`chip ${ans.timeBudget === opt ? 'on' : ''}`} onClick={() => updateAns('timeBudget', opt)}>{opt}</div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 10 && (
          <div className="ins-step">
            {renderTitle('Aversions & Allergies')}
            <div className="mt mb-4">Any ingredients you must avoid entirely.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ans.algList.map((alg, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input 
                      className="field"
                      style={{width: '100%', padding: '0.85rem', background: 'var(--bg)', color: 'var(--silver)', border: '1px solid var(--border)', borderRadius: '4px'}}
                      value={alg} 
                      onChange={e => {
                        const newList = [...ans.algList];
                        newList[i] = e.target.value;
                        updateAns('algList', newList);
                      }}
                      placeholder="Ingredient name..." 
                    />
                  </div>
                  <button className="btn sm" style={{ background: 'transparent', color: 'var(--plum)', padding: '0.5rem' }} onClick={() => {
                    const newList = [...ans.algList];
                    newList.splice(i, 1);
                    updateAns('algList', newList);
                  }}>Remove</button>
                </div>
              ))}
              <button className="btn" onClick={() => updateAns('algList', [...ans.algList, ''])} style={{ width: 'fit-content' }}>+ Add Aversion</button>
            </div>
          </div>
        )}

        {currentStep === 11 && (
          <div className="ins-step">
            {renderTitle('Systemic Conditions')}
            <div className="mt mb-4">Select all conditions that affect your routines.</div>
            <div className="chips mt-4">
              {['Eczema / Atopic Dermatitis', 'Psoriasis', 'Rosacea', 'Acne Vulgaris', 'Hyperhidrosis', 'PCOS', 'None'].map(opt => (
                <div key={opt} className={`chip ${ans.conditions.includes(opt) ? 'on' : ''}`} onClick={() => toggleMulti('conditions', opt)}>{opt}</div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 12 && (
          <div className="ins-step">
            {renderTitle('Medical Directives (Topical)')}
            <div className="mt mb-4">Add any prescribed topical treatments.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {ans.rxList.map((rx, i) => (
                <div key={i} style={{ borderLeft: '2px solid var(--gold)', paddingLeft: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--plum)' }}>Systemic {i + 1}</span>
                    <button className="btn sm" style={{ background: 'transparent', color: 'var(--plum)', padding: 0 }} onClick={() => {
                      const newList = [...ans.rxList];
                      newList.splice(i, 1);
                      updateAns('rxList', newList);
                    }}>Remove</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input className="field" style={{padding: '0.85rem', background: 'var(--bg)', color: 'var(--silver)', border: '1px solid var(--border)', borderRadius: '4px'}} value={rx.name} onChange={e => { const l = [...ans.rxList]; l[i].name = e.target.value; updateAns('rxList', l); }} placeholder="Name" />
                    <input className="field" style={{padding: '0.85rem', background: 'var(--bg)', color: 'var(--silver)', border: '1px solid var(--border)', borderRadius: '4px'}} value={rx.zone} onChange={e => { const l = [...ans.rxList]; l[i].zone = e.target.value; updateAns('rxList', l); }} placeholder="Zone" />
                  </div>
                </div>
              ))}
              <button className="btn" onClick={() => updateAns('rxList', [...ans.rxList, { name: '', zone: '' }])} style={{ width: 'fit-content' }}>+ Add Topical</button>
            </div>
          </div>
        )}

        {currentStep === 13 && (
          <div className="ins-step">
            {renderTitle('Medical Directives (Oral)')}
            <div className="mt mb-4">Add any systemic internal remedies.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {ans.oralList.map((med, i) => (
                <div key={i} style={{ borderLeft: '2px solid var(--gold)', paddingLeft: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--plum)' }}>Systemic {i + 1}</span>
                    <button className="btn sm" style={{ background: 'transparent', color: 'var(--plum)', padding: 0 }} onClick={() => {
                      const newList = [...ans.oralList];
                      newList.splice(i, 1);
                      updateAns('oralList', newList);
                    }}>Remove</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input className="field" style={{padding: '0.85rem', background: 'var(--bg)', color: 'var(--silver)', border: '1px solid var(--border)', borderRadius: '4px'}} value={med.name} onChange={e => { const l = [...ans.oralList]; l[i].name = e.target.value; updateAns('oralList', l); }} placeholder="Name" />
                  </div>
                </div>
              ))}
              <button className="btn" onClick={() => updateAns('oralList', [...ans.oralList, { name: '', type: 'prescription' }])} style={{ width: 'fit-content' }}>+ Add Systemic</button>
            </div>
          </div>
        )}

        {currentStep === 14 && (
          <div className="ins-step">
            {renderTitle('Zone-Specific Concerns')}
            <div className="mt mb-4">What specific focus areas do you have?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {['full-face (Face)', 'scalp (Scalp)', 'general-body (Body)'].map(zoneLabel => {
                const zone = zoneLabel.split(' ')[0];
                const label = zoneLabel.split(' ')[1].replace(/[()]/g, '');
                return (
                <div key={zone}>
                  <h4 style={{ color: 'var(--gold)' }}>{label}</h4>
                  <div className="chips mt-2">
                    {['Acne', 'Aging', 'Hyperpigmentation', 'Dryness', 'Redness', 'Texture', 'None'].map(opt => (
                      <div key={opt} className={`chip ${(ans.concerns[zone] || []).includes(opt) ? 'on' : ''}`} onClick={() => {
                        const existing = ans.concerns[zone] || [];
                        let next = [];
                        if (existing.includes(opt)) next = existing.filter(x => x !== opt);
                        else next = [...existing, opt];
                        updateAns('concerns', { ...ans.concerns, [zone]: next });
                      }}>{opt}</div>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}

        {currentStep === 15 && (
          <div className="ins-step" style={{ textAlign: 'center', margin: 'auto' }}>
            <h3 style={{ fontSize: '3rem', color: 'var(--plum)' }}>The First Inscription is consecrated</h3>
            <div className="mt" style={{ fontSize: '1.2rem', marginTop: '2rem' }}>Your chamber awaits.</div>
          </div>
        )}
      </div>

      <div id="fast-route-controls" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <button 
          className="btn" 
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
        >
          Step Backwards
        </button>
        
        <div id="ins-dots" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {Array.from({ length: 15 }).map((_, idx) => (
            <div key={idx} className={`dot ${idx + 1 === currentStep ? 'active' : ''}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx + 1 === currentStep ? 'var(--crimson)' : 'var(--border)' }} />
          ))}
        </div>
        
        <button 
          className="btn plum" 
          onClick={() => {
            if (currentStep < 15) setCurrentStep(prev => prev + 1);
            else handleFinish();
          }}
        >
          {currentStep === 15 ? 'Enter the Sanctuary' : 'Step Deeper'}
        </button>
      </div>
    </div>
  );
}
