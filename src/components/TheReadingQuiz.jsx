import React, { useState } from 'react';
import Icon from './Icon.jsx';
import SpeakerButton from './SpeakerButton.jsx';

export default function TheReadingQuiz({ onComplete, onAbandon, profile, contextData }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    shiftInForm: '',
    emergingShadows: [],
    textureTouch: [],
    rhythms: []
  });

  const toggleMulti = (key, val) => {
    setAnswers(prev => {
      const arr = prev[key] || [];
      if (arr.includes(val)) return { ...prev, [key]: arr.filter(x => x !== val) };
      return { ...prev, [key]: [...arr, val] };
    });
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ color: 'var(--plum)' }}>The Ledger of the Stars</h3>
      <p style={{ color: 'var(--dim)' }}>The Keeper has observed your recent actions.</p>
      
      <div style={{ padding: '1rem', background: 'var(--card2)', borderRadius: '8px' }}>
        <h4 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}><Icon name="ph-warning-circle" /> Recorded Reactions</h4>
        {contextData.reactions.length > 0 ? (
          <ul style={{ paddingLeft: '1.2rem', color: 'var(--crimson)' }}>
            {contextData.reactions.map((r, i) => <li key={i}>{r.items?.name || 'Unknown'}: {r.reaction_type}</li>)}
          </ul>
        ) : <p style={{ color: 'var(--dim)', margin: 0 }}>No adverse reactions logged.</p>}
        
        <h4 style={{ color: 'var(--text)', margin: '1rem 0 0.5rem 0' }}><Icon name="ph-prohibit" /> Banished Relics</h4>
        {contextData.banished.length > 0 ? (
          <ul style={{ paddingLeft: '1.2rem', color: 'var(--silver)' }}>
            {contextData.banished.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        ) : <p style={{ color: 'var(--dim)', margin: 0 }}>No items banished recently.</p>}
        
        <h4 style={{ color: 'var(--text)', margin: '1rem 0 0.5rem 0' }}><Icon name="ph-hourglass-low" /> Waning Vessels</h4>
        {contextData.waning.length > 0 ? (
          <ul style={{ paddingLeft: '1.2rem', color: 'var(--silver)' }}>
            {contextData.waning.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        ) : <p style={{ color: 'var(--dim)', margin: 0 }}>No vessels are currently emptying.</p>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button className="btn plum" onClick={handleNext}>Acknowledge & Proceed</button>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const opts = ['No Change', 'Shifted to Oily', 'Shifted to Dry', 'Shifted to Combination', 'Increased Sensitivity'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ color: 'var(--plum)' }}>Shift in Form</h3>
        <p style={{ color: 'var(--dim)' }}>Has your foundational skin type shifted this cycle?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
          {opts.map(opt => (
            <button key={opt} className={`btn ${answers.shiftInForm === opt ? 'plum' : ''}`} style={{ textAlign: 'left', padding: '1rem' }} onClick={() => setAnswers({...answers, shiftInForm: opt})}>
              {opt}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button className="btn" onClick={handleBack}>Back</button>
          <button className="btn plum" onClick={handleNext} disabled={!answers.shiftInForm}>Proceed</button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    const opts = ['Hyperpigmentation', 'Breakouts/Congestion', 'Flaking/Barrier Damage', 'Dullness', 'Redness/Rosacea Flare'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ color: 'var(--plum)' }}>Emerging Shadows</h3>
        <p style={{ color: 'var(--dim)' }}>Are there new concerns emerging? (Select all that apply)</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
          {opts.map(opt => (
            <button key={opt} className={`btn ${answers.emergingShadows.includes(opt) ? 'plum' : ''}`} style={{ textAlign: 'left', padding: '1rem' }} onClick={() => toggleMulti('emergingShadows', opt)}>
              {answers.emergingShadows.includes(opt) ? <Icon name="ph-check-circle" weight="fill" /> : <Icon name="ph-circle" />} {opt}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button className="btn" onClick={handleBack}>Back</button>
          <button className="btn plum" onClick={handleNext}>Proceed</button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const opts = ['Serving well', 'Need lighter textures (Gels/Fluids)', 'Need heavier textures (Creams/Balms)', 'Experiencing pilling/layering issues'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ color: 'var(--plum)' }}>Texture & Touch</h3>
        <p style={{ color: 'var(--dim)' }}>Are your current product textures still serving you?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
          {opts.map(opt => (
            <button key={opt} className={`btn ${answers.textureTouch.includes(opt) ? 'plum' : ''}`} style={{ textAlign: 'left', padding: '1rem' }} onClick={() => toggleMulti('textureTouch', opt)}>
              {answers.textureTouch.includes(opt) ? <Icon name="ph-check-circle" weight="fill" /> : <Icon name="ph-circle" />} {opt}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button className="btn" onClick={handleBack}>Back</button>
          <button className="btn plum" onClick={handleNext}>Proceed</button>
        </div>
      </div>
    );
  };

  const renderStep5 = () => {
    const opts = ['Sleep Deprivation', 'High Stress', 'Travel', 'Climate/Season Shift', 'Cycle Changes', 'New Medications'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ color: 'var(--plum)' }}>Rhythms & Rituals</h3>
        <p style={{ color: 'var(--dim)' }}>Have your lifestyle rhythms altered? (Select all that apply)</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
          {opts.map(opt => (
            <button key={opt} className={`btn ${answers.rhythms.includes(opt) ? 'plum' : ''}`} style={{ textAlign: 'left', padding: '1rem' }} onClick={() => toggleMulti('rhythms', opt)}>
              {answers.rhythms.includes(opt) ? <Icon name="ph-check-circle" weight="fill" /> : <Icon name="ph-circle" />} {opt}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button className="btn" onClick={handleBack}>Back</button>
          <button className="btn plum" onClick={() => onComplete(answers)}>Consecrate The Reading</button>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal card" style={{ maxWidth: '600px' }}>
        <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ color: 'var(--plum)', margin: 0 }}>The Reading <SpeakerButton text="The Reading" /></h3>
          <button className="spk" onClick={onAbandon} title="Abandon Reading" style={{ fontSize: '1.2rem', padding: '0.2rem' }}>
            <i className="ph-duotone ph-x"></i>
          </button>
        </div>
        <div className="mt mb-4" style={{ color: 'var(--dim)' }}>Reflect on the past 30 days of your rituals. Step {step} of 5.</div>
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  );
}


