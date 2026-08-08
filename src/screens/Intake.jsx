import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { attachVoice } from '../lib/voice.js';
import SpeakerButton from '../components/SpeakerButton.jsx';
import * as AI from '../lib/ai-service.js';
import Icon from '../components/Icon.jsx';
import { G } from '../lib/icons.jsx';

import VoiceInput from '../components/VoiceInput.jsx';

export default function Intake({ onComplete }) {
  const [path, setPath] = useState('ai');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Fast Path State
  const [skinTypesOptions, setSkinTypesOptions] = useState([]);
  const [concernsOptions, setConcernsOptions] = useState([]);
  const [conditionsOptions, setConditionsOptions] = useState([]);
  const [traditionsOptions, setTraditionsOptions] = useState([]);
  const [texturesOptions, setTexturesOptions] = useState([]);
  
  const [selectedSkinType, setSelectedSkinType] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState([]);
  const [primaryConcern, setPrimaryConcern] = useState('');
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedTextures, setSelectedTextures] = useState([]);
  const [selectedTraditions, setSelectedTraditions] = useState([]);
  
  const [rxList, setRxList] = useState([]);
  const [oralList, setOralList] = useState([]);
  const [algList, setAlgList] = useState([]);
  const [newAlg, setNewAlg] = useState('');
  
  const [noRx, setNoRx] = useState(false);
  const [noOral, setNoOral] = useState(false);
  const [prescriptionStartDate, setPrescriptionStartDate] = useState('');
  const [noAlg, setNoAlg] = useState(false);

  // AI Path State
  const [isReady, setIsReady] = useState(true);
  const [aiStatus, setAiStatus] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Greetings. I am the Keeper of The Lounge. Let us prepare your chamber. What brings you to this place?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatLogRef = useRef(null);

  useEffect(() => {
    supabase.from('user_profile').select('intake_answers, intake_completed').maybeSingle().then(({ data }) => {
      if (data) {
        if (data.intake_completed) {
          onComplete(); // Defend against accidental re-entry bugs
          return;
        }
        if (data.intake_answers) {
          const ans = data.intake_answers;
        if (ans.skinType) setSelectedSkinType(ans.skinType);
        if (ans.concerns) setSelectedConcerns(ans.concerns);
        if (ans.primaryConcern) setPrimaryConcern(ans.primaryConcern);
        if (ans.conditions) setSelectedConditions(ans.conditions);
        if (ans.textures) setSelectedTextures(ans.textures);
        if (ans.traditions) setSelectedTraditions(ans.traditions);
        if (ans.rxList) setRxList(ans.rxList);
        if (ans.oralList) setOralList(ans.oralList);
        if (ans.algList) setAlgList(ans.algList);
        if (ans.noRx) setNoRx(ans.noRx);
        if (ans.noOral) setNoOral(ans.noOral);
        if (ans.noAlg) setNoAlg(ans.noAlg);
        if (ans.prescription_start_date) setPrescriptionStartDate(ans.prescription_start_date);
        
        // If they already completed it but are just missing the date, jump to step 4
        if (ans.oralList && ans.oralList.some(m => m.toLowerCase().includes('isotretinoin') || m.toLowerCase().includes('accutane')) && !ans.prescription_start_date) {
            setPath('fast');
            setCurrentStep(4);
        }
        }
      }
    });
  }, []);

  useEffect(() => {
    AI.generateSkinTypes().then(setSkinTypesOptions);
    AI.generateConcerns().then(setConcernsOptions);
    AI.generateConditions().then(setConditionsOptions);
    AI.generateTextures().then(setTexturesOptions);
    AI.generateTraditions().then(setTraditionsOptions);
  }, []);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatHistory]);



  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    
    setChatInput('');
    const newHistory = [...chatHistory, { role: 'user', content: text }];
    setChatHistory(newHistory);
    setAiStatus('The Keeper is listening...');
    
    try {
      const { conductIntake } = await import('../lib/ai-engine.js');
      const { reply, extractedData } = await conductIntake(newHistory);
      
      setAiStatus('');
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
      
      if (extractedData) {
        setAiStatus('The Keeper has finished divining your answers.');
        const avatarConfig = JSON.parse(localStorage.getItem('avatar_config') || '{}');
        const { data: existing } = await supabase.from('user_profile').select('id').maybeSingle();
        const profileData = {
          intake_completed: true,
          intake_answers: { ...extractedData, prescription_start_date: prescriptionStartDate },
          avatar_config: avatarConfig
        };
        if (existing) {
          await supabase.from('user_profile').update(profileData).eq('id', existing.id);
        } else {
          await supabase.from('user_profile').insert([profileData]);
        }
        localStorage.setItem('intake_completed', 'true');
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (err) {
      setAiStatus('Error: ' + err.message);
      setChatHistory(prev => prev.slice(0, -1));
    }
  };

  const handleFinishFastRoute = async () => {
    const concerns = selectedConcerns;
    const conditions = selectedConditions;
    const traditions = selectedTraditions;

    const filteredRxList = noRx ? [] : rxList.filter(rx => rx.name && rx.name.trim() !== '');
    const filteredOralList = noOral ? [] : oralList.filter(o => o && o.trim() !== '');
    const filteredAlgList = noAlg ? [] : algList.filter(a => a && a.trim() !== '');

    const avatarConfig = JSON.parse(localStorage.getItem('avatar_config') || '{}');
    const { data: existing } = await supabase.from('user_profile').select('id').maybeSingle();
    const profileData = {
      intake_completed: true,
    const profileData = {
      intake_completed: true,
      intake_answers: { 
        skinType: selectedSkinType,
        concerns: selectedConcerns, 
        primaryConcern,
        conditions: selectedConditions, 
        textures: selectedTextures,
        traditions: selectedTraditions, 
        noRx, 
        noOral, 
        noAlg, 
        rxList: filteredRxList, 
        oralList: filteredOralList, 
        algList: filteredAlgList, 
        prescription_start_date: prescriptionStartDate 
      },
      avatar_config: avatarConfig
    };
    
    if (existing) {
      await supabase.from('user_profile').update(profileData).eq('id', existing.id);
    } else {
      await supabase.from('user_profile').insert([profileData]);
    }
    
    localStorage.setItem('intake_completed', 'true');
    onComplete();
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedSkinType !== '';
    if (currentStep === 2) return selectedConcerns.length > 0 && (selectedConcerns.includes('relaxation') || selectedConcerns.includes('na') || primaryConcern !== '');
    if (currentStep === 3) return selectedConditions.length > 0;
    if (currentStep === 4) return selectedTextures.length > 0;
    if (currentStep === 5) return noRx || rxList.some(r => r.name.trim() !== '');
    if (currentStep === 6) return noOral || oralList.some(o => o.trim() !== '');
    if (currentStep === 7) return noAlg || algList.length > 0 || newAlg.trim() !== '';
    if (currentStep === 8) return selectedTraditions.length > 0;
    return true;
  };
  const totalSteps = 9;

  const toggleSelection = (setter, item) => {
    setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };
  
  const updateRx = (index, field, value) => {
    const newList = [...rxList];
    newList[index][field] = value;
    setRxList(newList);
  };
  
  const addRx = () => {
    setRxList([...rxList, { name: '', strength: '', zone: '', frequency: '' }]);
  };

  const removeRx = (index) => {
    const newList = [...rxList];
    newList.splice(index, 1);
    setRxList(newList);
  };

  const updateOral = (index, value) => {
    const newList = [...oralList];
    newList[index] = value;
    setOralList(newList);
  };
  
  const addOral = () => {
    setOralList([...oralList, '']);
  };

  const removeOral = (index) => {
    const newList = [...oralList];
    newList.splice(index, 1);
    setOralList(newList);
  };

  const addAlg = () => {
    if (newAlg.trim()) {
      setAlgList([...algList, newAlg.trim()]);
      setNewAlg('');
    }
  };

  const renderTitle = (titleText) => (
    <h3>
      {titleText} <SpeakerButton text={titleText} />
    </h3>
  );

  return (
    <div className="card" style={{ width: '100%', maxWidth: '700px', minHeight: '400px', margin: '2rem auto', display: 'flex', flexDirection: 'column' }}>
      <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
      
      <div style={{ flexShrink: 0 }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', color: 'var(--plum)' }}>
          <Icon name={G.sparkles || 'sparkles'} /> The First Inscription
        </h2>
        
        <div id="path-toggle" style={{ textAlign: 'center', marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button 
            className="btn" 
            onClick={() => setPath('ai')}
            style={{ 
              background: path === 'ai' ? 'rgba(0,0,0,0.4)' : 'transparent', 
              color: path === 'ai' ? 'var(--plum)' : 'var(--silver)', 
              border: path === 'ai' ? '1px solid var(--plum)' : '1px solid var(--border)',
              fontSize: '1.3rem',
              padding: '0.6rem 1.2rem'
            }}
          >
            The Guardian's Inquiry
          </button>
          <button 
            className="btn" 
            onClick={() => setPath('fast')}
            style={{ 
              background: path === 'fast' ? 'rgba(0,0,0,0.4)' : 'transparent', 
              color: path === 'fast' ? 'var(--plum)' : 'var(--silver)',
              border: path === 'fast' ? '1px solid var(--plum)' : '1px solid var(--border)',
              fontSize: '1.3rem',
              padding: '0.6rem 1.2rem'
            }}
          >
            The Swift Invocation
          </button>
        </div>
      </div>

      {path === 'ai' && (
        <div id="ai-path" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div 
            id="ai-chat-log" 
            ref={chatLogRef}
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              border: '1px solid var(--border)', 
              padding: '1rem', 
              marginBottom: '1rem', 
              background: 'rgba(0,0,0,0.1)', 
              borderRadius: '4px', 
              fontSize: '1.1rem', 
              lineHeight: '1.5' 
            }}
          >
            {chatHistory.map((msg, idx) => (
              <div 
                key={idx} 
                className={`msg ${msg.role === 'assistant' ? 'ai' : 'user'}`} 
                style={{ 
                  color: msg.role === 'assistant' ? 'var(--silver)' : 'var(--plum)', 
                  marginBottom: '1rem',
                  textAlign: msg.role === 'user' ? 'right' : 'left'
                }}
              >
                {msg.content}
              </div>
            ))}
          </div>
          <div className="field" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
            <div className="ip mic" style={{ flex: 1 }}>
              <VoiceInput 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                placeholder="Speak your mind..." 
              />
            </div>
            <button className="btn plum" onClick={sendChatMessage}>Whisper</button>
          </div>
          <div id="ai-status" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--plum)', minHeight: '1.5rem', flexShrink: 0 }}>
            {aiStatus}
          </div>
        </div>
      )}

      {path === 'fast' && (
        <div id="ins-steps" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
          {currentStep === 1 && (
            <div className="ins-step">
              {renderTitle('The Foundation of the Vessel')}
              <div className="mt">Which best describes your skin\'s natural state?</div>
              <div className="chips">
                {skinTypesOptions.length > 0 ? skinTypesOptions.map(st => (
                  <div 
                    key={st.id}
                    className={`chip ${selectedSkinType === st.id ? 'on' : ''}`}
                    onClick={() => setSelectedSkinType(st.id)}
                  >
                    {st.label}
                  </div>
                )) : <div style={{ opacity: 0.5 }}>Divining skin types...</div>}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="ins-step">
              {renderTitle('What brings you to this place?')}
              <div className="mt mb-4">Select all that weigh upon you. <strong>Double-tap one to mark it as your Primary focus.</strong></div>
              <div className="chips">
                <div 
                  className={`chip ${selectedConcerns.includes('relaxation') ? 'on' : ''}`}
                  onClick={() => { setSelectedConcerns(['relaxation']); setPrimaryConcern('relaxation'); }}
                >
                  Relaxation, just for the sake of relaxation
                </div>
                <div 
                  className={`chip ${selectedConcerns.includes('na') ? 'on' : ''}`}
                  onClick={() => { setSelectedConcerns(['na']); setPrimaryConcern('na'); }}
                >
                  Not Applicable
                </div>
                {concernsOptions.length > 0 ? concernsOptions.map(c => (
                  <div 
                    key={c.id}
                    className={`chip ${selectedConcerns.includes(c.id) ? 'on' : ''} ${primaryConcern === c.id ? 'primary-concern-chip' : ''}`}
                    style={{ border: primaryConcern === c.id ? '2px solid var(--gold)' : '' }}
                    onClick={() => {
                      if (selectedConcerns.includes('relaxation') || selectedConcerns.includes('na')) {
                        setSelectedConcerns([c.id]);
                        setPrimaryConcern('');
                      } else {
                        toggleSelection(setSelectedConcerns, c.id);
                        if (primaryConcern === c.id) setPrimaryConcern('');
                      }
                    }}
                    onDoubleClick={() => setPrimaryConcern(c.id)}
                  >
                    {c.label} {primaryConcern === c.id && <span style={{fontSize: '0.7rem', color: 'var(--gold)', marginLeft: '0.3rem'}}>(Primary)</span>}
                  </div>
                )) : <div style={{ opacity: 0.5 }}>Divining concerns...</div>}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="ins-step">
              {renderTitle('What must the Lounge protect?')}
              <div className="mt">Conditions that shape how you care for yourself. Be sure to include systemic, scalp, or full-body conditions.</div>
              <div className="chips" style={{ marginTop: '1rem' }}>
                <div 
                  className={`chip ${selectedConditions.includes('na') ? 'on' : ''}`}
                  onClick={() => setSelectedConditions(['na'])}
                >
                  Not Applicable
                </div>
                {conditionsOptions.length > 0 ? conditionsOptions.map(c => (
                  <div 
                    key={c.id} 
                    className={`chip ${selectedConditions.includes(c.id) ? 'on' : ''}`}
                    onClick={() => {
                      if (selectedConditions.includes('na')) {
                        setSelectedConditions([c.id]);
                      } else {
                        toggleSelection(setSelectedConditions, c.id);
                      }
                    }}
                  >
                    {c.label}
                  </div>
                )) : <div style={{ opacity: 0.5 }}>Divining conditions...</div>}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="ins-step">
              {renderTitle('Sensory Preferences')}
              <div className="mt">What product formats and textures do you prefer to apply?</div>
              <div className="chips" style={{ marginTop: '1rem' }}>
                <div 
                  className={`chip ${selectedTextures.includes('na') ? 'on' : ''}`}
                  onClick={() => setSelectedTextures(['na'])}
                >
                  I have no preference
                </div>
                {texturesOptions.length > 0 ? texturesOptions.map(t => (
                  <div 
                    key={t.id} 
                    className={`chip ${selectedTextures.includes(t.id) ? 'on' : ''}`}
                    onClick={() => {
                      if (selectedTextures.includes('na')) {
                        setSelectedTextures([t.id]);
                      } else {
                        toggleSelection(setSelectedTextures, t.id);
                      }
                    }}
                  >
                    {t.label}
                  </div>
                )) : <div style={{ opacity: 0.5 }}>Divining textures...</div>}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="ins-step">
              {renderTitle('Sacred Healing Directives (Topical Decrees)')}
              <div className="mt mb-4">Potent formulas prescribed by healers. These take priority in all routines.</div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--plum)' }}>
                <input type="checkbox" checked={noRx} onChange={e => { setNoRx(e.target.checked); if(e.target.checked) setRxList([]); }} /> I am burdened by no topical prescriptions.
              </label>

              {!noRx && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {rxList.map((rx, i) => (
                    <div key={i} style={{ borderLeft: '2px solid var(--gold)', paddingLeft: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--plum)', }}>Prescription {i + 1}</span>
                        <button className="btn sm" style={{ background: 'transparent', color: 'var(--plum)', padding: 0 }} onClick={() => removeRx(i)}>Shatter</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="field">
                          <label style={{ color: 'var(--silver)', fontSize: '0.9rem', marginBottom: '0.3rem', display: 'block' }}>Name</label>
                          <VoiceInput value={rx.name} onChange={e => updateRx(i, 'name', e.target.value)} placeholder="e.g. Tacrolimus" />
                        </div>
                        <div className="field">
                          <label style={{ color: 'var(--silver)', fontSize: '0.9rem', marginBottom: '0.3rem', display: 'block' }}>Strength</label>
                          <VoiceInput value={rx.strength} onChange={e => updateRx(i, 'strength', e.target.value)} placeholder="e.g. 0.05%" />
                        </div>
                        <div className="field">
                          <label style={{ color: 'var(--silver)', fontSize: '0.9rem', marginBottom: '0.3rem', display: 'block' }}>Zone</label>
                          <VoiceInput value={rx.zone} onChange={e => updateRx(i, 'zone', e.target.value)} placeholder="e.g. Face" />
                        </div>
                        <div className="field">
                          <label style={{ color: 'var(--silver)', fontSize: '0.9rem', marginBottom: '0.3rem', display: 'block' }}>Frequency</label>
                          <VoiceInput value={rx.frequency} onChange={e => updateRx(i, 'frequency', e.target.value)} placeholder="e.g. Nightly" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn" onClick={addRx} style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icon name="plus" /> Summon Topical Prescription</button>
                </div>
              )}
            </div>
          )}

          {currentStep === 6 && (
            <div className="ins-step">
              {renderTitle('Medical Directives (Oral)')}
              <div className="mt mb-4">Internal remedies that may cause systemic shifts (e.g. dryness, sensitivity).</div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--plum)' }}>
                <input type="checkbox" checked={noOral} onChange={e => { setNoOral(e.target.checked); if(e.target.checked) setOralList([]); }} /> I consume no internal remedies that alter my vessel.
              </label>

{!noOral && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {oralList.map((med, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <VoiceInput value={med} onChange={e => updateOral(i, e.target.value)} placeholder="e.g. Spironolactone" />
                      </div>
                      <button className="btn sm" style={{ background: 'transparent', color: 'var(--plum)', padding: '0.5rem' }} onClick={() => removeOral(i)}>Shatter</button>
                    </div>
                  ))}
                  <button className="btn" onClick={addOral} style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icon name="plus" /> Summon Systemic Measure</button>
                  
                  {oralList.some(m => m.toLowerCase().includes('isotretinoin') || m.toLowerCase().includes('accutane')) && (
                    <div className="field mt-4" style={{ padding: '1rem', border: '1px solid var(--crimson)', borderRadius: '8px' }}>
                      <label style={{ color: 'var(--plum)', display: 'block', marginBottom: '0.5rem' }}>When did you begin this systemic regimen?</label>
                      <input type="date" value={prescriptionStartDate} onChange={e => setPrescriptionStartDate(e.target.value)} style={{ padding: '0.5rem', background: 'var(--bg)', color: 'var(--silver)', border: '1px solid var(--border)', borderRadius: '4px' }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 7 && (
            <div className="ins-step">
              {renderTitle('The ingredients to never touch')}
              <div className="mt mb-4">Allergies and sensitivities.</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--plum)' }}>
                <input type="checkbox" checked={noAlg} onChange={e => { setNoAlg(e.target.checked); if(e.target.checked) setAlgList([]); }} /> I hold no other aversions.
              </label>
              {!noAlg && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {algList.map((alg, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <VoiceInput 
                          value={alg} 
                          onChange={e => {
                            const newList = [...algList];
                            newList[i] = e.target.value;
                            setAlgList(newList);
                          }}
                          placeholder="e.g. Lanolin" 
                        />
                      </div>
                      <button className="btn sm" style={{ background: 'transparent', color: 'var(--plum)', padding: '0.5rem' }} onClick={() => {
                        const newList = [...algList];
                        newList.splice(i, 1);
                        setAlgList(newList);
                      }}>Shatter</button>
                    </div>
                  ))}
                  <button className="btn" onClick={() => setAlgList([...algList, ''])} style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Icon name="plus" /> Summon Aversion</button>
                </div>
              )}
            </div>
          )}

          {currentStep === 8 && (
            <div className="ins-step">
              {renderTitle('Which traditions call to you?')}
              <div className="mt">Your preferred approaches to care.</div>
              <div className="chips">
                <div 
                  className={`chip ${selectedTraditions.includes('na') ? 'on' : ''}`}
                  onClick={() => setSelectedTraditions(['na'])}
                >
                  Not Applicable
                </div>
                {traditionsOptions.length > 0 ? traditionsOptions.map(c => (
                  <div 
                    key={c.id} 
                    className={`chip ${selectedTraditions.includes(c.id) ? 'on' : ''}`}
                    onClick={() => {
                      if (selectedTraditions.includes('na')) {
                        setSelectedTraditions([c.id]);
                      } else {
                        toggleSelection(setSelectedTraditions, c.id);
                      }
                    }}
                  >
                    {c.label}
                  </div>
                )) : <div style={{ opacity: 0.5 }}>Divining traditions...</div>}
              </div>
            </div>
          )}

          {currentStep === 9 && (
            <div className="ins-step" style={{ textAlign: 'center', margin: 'auto' }}>
              <h3 style={{ fontSize: '3rem', color: 'var(--plum)' }}>The First Inscription is consecrated</h3>
              <div className="mt" style={{ fontSize: '1.2rem', marginTop: '2rem' }}>Your chamber awaits.</div>
            </div>
          )}
        </div>
      )}

      {path === 'fast' && (
        <div id="fast-route-controls" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <button 
            className="btn" 
            onClick={() => {
              if (currentStep === 3 && selectedConcerns.includes('relaxation')) {
                setCurrentStep(1);
              } else {
                setCurrentStep(prev => Math.max(1, prev - 1));
              }
            }}
            style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
          >
            Step Backwards
          </button>
          
          <div id="ins-dots" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {Array.from({ length: totalSteps }).map((_, idx) => {
              const i = idx + 1;
              return (
                <div 
                  key={i} 
                  className={`dot ${i === currentStep ? 'active' : ''}`} 
                  style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: i === currentStep ? 'var(--crimson)' : 'var(--border)' 
                  }}
                />
              );
            })}
          </div>
          
          <button 
            className="btn plum" 
            disabled={!canProceed()}
            style={{ opacity: canProceed() ? 1 : 0.5, cursor: canProceed() ? 'pointer' : 'not-allowed' }}
            onClick={() => {
              if (currentStep === 1 && selectedConcerns.includes('relaxation')) {
                setCurrentStep(3); // Skip conditions, go to Rx
              } else if (currentStep < totalSteps) {
                setCurrentStep(prev => prev + 1);
              } else {
                handleFinishFastRoute();
              }
            }}
          >
            {currentStep === totalSteps ? 'Enter the Sanctuary' : 'Step Deeper'}
          </button>
        </div>
      )}
    </div>
  );
}

