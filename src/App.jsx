import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase.js';
import { G, verifyGlyphs } from './lib/icons.jsx';
import { useDialog } from './components/Dialogs.jsx';
import { speak, getTtsEnabled, getTtsRate, getTtsPitch, getTtsVoiceURI, setTtsEnabled, setTtsRate, setTtsPitch, setTtsVoiceURI, getFeminineVoices } from './lib/tts.js';
import Icon from './components/Icon.jsx';
import { initGoogleCalendar, requestCalendarAccess } from './lib/gcal.js';
import { syncWearableSnapshot } from './lib/health-connect.js';
import { Capacitor } from '@capacitor/core';
import { initEngineRules } from './lib/routine-engine.js';

import ConjureVisage from './screens/ConjureVisage.jsx';
import Landing from './screens/Landing.jsx';
import Intake from './screens/Intake.jsx';
import Rites from './screens/Rites.jsx';
import Grimoire from './screens/Grimoire.jsx';
import Altars from './screens/Altars.jsx';
import Rootwork from './screens/Rootwork.jsx';
import Scrying from './screens/Scrying.jsx';
import ShadowTome from './screens/ShadowTome.jsx';

const TABS = [
  { id: 'rites', label: 'The Mortal Rites', glyph: G.tabRites, bg: '/assets/bg_rites.jpg', pose: 'working' },
  { id: 'grim', label: 'The Grimoire', glyph: G.tabGrim, bg: '/assets/bg_grimoire.jpg', pose: 'reading' },
  { id: 'altars', label: 'The Altars', glyph: G.tabAltars, bg: '/assets/bg_altars.jpg', pose: 'meditating' },
  { id: 'root', label: 'The Rootwork', glyph: G.tabRoot, bg: '/assets/bg_rootwork.jpg', pose: 'working' },
  { id: 'pool', label: 'The Scrying Pool', glyph: G.tabPool, bg: '/assets/bg_scrying.jpg', pose: 'scrying' },
  { id: 'tome', label: 'The Shadow Tome', glyph: G.tabTome, bg: '/assets/bg_shadowtome.jpg', pose: 'reading' }
];

function getSpellDate() {
  const d = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const day = d.getDate();
  const suffix = ['th','st','nd','rd'][(day % 10 > 3) ? 0 : (day % 100 - day % 10 !== 10) * day % 10];
  return `${day}${suffix} of ${months[d.getMonth()]}`;
}

export default function App() {
  const { alert, confirm } = useDialog();
  const [currentScreen, setCurrentScreen] = useState(() => {
    if (!localStorage.getItem('avatar_config')) return 'landing';
    const stored = sessionStorage.getItem('al_currentScreen');
    return (stored && stored !== 'splash') ? stored : 'landing';
  });
  const [activeTab, setActiveTab] = useState(() => {
    if (!localStorage.getItem('avatar_config')) return 'rites';
    return sessionStorage.getItem('al_activeTab') || 'rites';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [dateStr, setDateStr] = useState(getSpellDate());
  const [supabaseError, setSupabaseError] = useState(false);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    fontSize: '18',
    fontFamily: 'Elsie',
    tts: false,
    health: false,
    cal: false,
    gcalClientId: ''
  });
  
  const [ttsOptions, setTtsOptions] = useState({
    voice: '',
    rate: 1.0,
    pitch: 1.0
  });

  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoginSubmitting(false);
    if (error) {
      setLoginError(error.message);
    } else {
      setLoginPassword('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    sessionStorage.setItem('al_currentScreen', currentScreen);
    if (currentScreen === 'landing' || currentScreen === 'avatar') {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = 'var(--bg)';
    } else if (currentScreen === 'intake') {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = 'var(--bg)';
    }
  }, [currentScreen]);

  useEffect(() => {
    sessionStorage.setItem('al_activeTab', activeTab);
    if (currentScreen === 'app') {
      // Try to load a personalized generated background for this tab first
      let bgUrl = null;
      try {
        const avatarConfig = JSON.parse(localStorage.getItem('avatar_config') || '{}');
        if (avatarConfig.generatedBgs && avatarConfig.generatedBgs[activeTab]) {
          bgUrl = avatarConfig.generatedBgs[activeTab];
        }
      } catch(e) {}

      // Fall back to static illustrated room backgrounds
      if (!bgUrl) {
        const tab = TABS.find(t => t.id === activeTab);
        bgUrl = tab?.bg || '/assets/bg_sanctuary.jpg';
      }

      document.body.style.backgroundImage = `url('${bgUrl}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
    }
  }, [activeTab, currentScreen]);

  useEffect(() => {
    verifyGlyphs();
    
    // Load Settings
    const saved = JSON.parse(localStorage.getItem('app_settings') || '{"fontSize":"18","fontFamily":"Sacramento","tts":false,"health":false,"cal":false}');
    setSettings(saved);
    applySettings(saved);
    
    setTtsOptions({
      voice: getTtsVoiceURI(),
      rate: getTtsRate(),
      pitch: getTtsPitch()
    });

    if (saved.health) {
      syncWearableSnapshot();
    }

    const populateVoices = () => {
      const voices = getFeminineVoices();
      setAvailableVoices(voices);
      const currentUri = getTtsVoiceURI();
      if (!currentUri && voices.length > 0) {
        setTtsVoiceURI(voices[0].voiceURI);
        setTtsOptions(prev => ({ ...prev, voice: voices[0].voiceURI }));
      }
    };
    
    if (window.speechSynthesis) {
      if (window.speechSynthesis.getVoices().length > 0) populateVoices();
      else window.speechSynthesis.onvoiceschanged = populateVoices;
    }
    
    // Initial background state is now handled by the useEffects tracking currentScreen and activeTab
    
    // Sync settings with profile in background
    supabase.from('user_profile').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle().then(({ data: profile, error }) => {
      if (error && error.message !== 'JWT expired' && error.message !== 'No current session') {
        setSupabaseError(true);
      }
      if (profile && profile.settings) {
        const stored = localStorage.getItem('al_settings');
        if (stored) {
          const s = JSON.parse(stored);
          setSettings(s);
          if (s.tts) setTtsEnabled(true);
          
          if (s.gcalClientId) {
            initGoogleCalendar(s.gcalClientId, (token) => {
              console.log("The Solar Almanac is Bound!");
            });
          }
        }    
        applySettings(profile.settings);
      }
      if (profile && profile.avatar_config) {
        localStorage.setItem('avatar_config', JSON.stringify(profile.avatar_config));
      }
      if (profile && profile.intake_completed) {
        localStorage.setItem('intake_completed', 'true');
      }
    });

    // Initialize Routine Engine deterministic rules (Codex + Conflicts)
    initEngineRules();

  }, []);

  const applySettings = (s) => {
    const fontSize = s.fontSize || '18';
    const fontFamily = s.fontFamily || 'Elsie';
    document.documentElement.style.setProperty('--fs', fontSize + 'px');
    document.documentElement.style.fontSize = fontSize + 'px';
    document.documentElement.style.setProperty('--ff', `"${fontFamily}", cursive, -apple-system,'Segoe UI',Roboto,sans-serif`);
    if (s.tts) {
      document.body.classList.remove('tts-disabled');
      setTtsEnabled(true);
    } else {
      document.body.classList.add('tts-disabled');
      setTtsEnabled(false);
    }
  };

  // Runs once on mount to recover avatar_config from Supabase if it's
  // missing locally (e.g. a new device/browser with an existing profile).
  // This used to only run when the old splash screen's "Enter" button was
  // clicked; now it runs automatically since that separate screen is gone.
  useEffect(() => {
    (async () => {
      if (localStorage.getItem('avatar_config')) return; // already have it locally
      let profile = null;
      try {
        const res = await supabase.from('user_profile').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (res.error) { setSupabaseError(true); return; }
        profile = res.data;
      } catch (e) {
        setSupabaseError(true);
        return;
      }
      if (profile && profile.avatar_config) {
        localStorage.setItem('avatar_config', JSON.stringify(profile.avatar_config));
      }
    })();
  }, []);

  const handleReturnToCottage = () => {
    if (settings.tts) speak("Return to Sanctuary");
    handleTabClick('rites');
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
    applySettings(newSettings);
    
    const { data: profile } = await supabase.from('user_profile').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (profile) {
      await supabase.from('user_profile').update({ settings: newSettings }).eq('id', profile.id);
    }
    setShowSettings(false);
  };

  const renderActiveTabContent = () => {
    const tab = TABS.find(t => t.id === activeTab);
    const pose = tab ? tab.pose : 'working';
    
    switch (activeTab) {
      case 'home': return <div style={{ minHeight: 'calc(100vh - 120px)' }}><Landing onProceed={(skipIntake) => skipIntake ? handleTabClick('rites') : setCurrentScreen('intake')} onOpenAvatar={() => setCurrentScreen('avatar')} /></div>;
      case 'rites': return <div><Rites pose={pose} /></div>;
      case 'grim': return <div><Grimoire pose={pose} /></div>;
      case 'altars': return <div><Altars pose={pose} /></div>;
      case 'root': return <div><Rootwork pose={pose} /></div>;
      case 'pool': return <div><Scrying pose={pose} /></div>;
      case 'tome': return <div><ShadowTome pose={pose} /></div>;
      default: return null;
    }
  };

  if (authLoading) {
    return (
      <div className="land" style={{ backgroundImage: 'url("/assets/app_bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <div className="tag" style={{ textShadow: '1px 1px 0 #0b090e, 0 4px 15px rgba(0,0,0,1)', color: 'var(--plum)', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)', padding: '0.6rem', display: 'inline-block' }}>Consulting the wards...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="land" style={{ backgroundImage: 'url("/assets/app_bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 8vw, 2.8rem)', textShadow: '2px 2px 0 #0b090e, -1px -1px 0 #0b090e, 1px -1px 0 #0b090e, -1px 1px 0 #0b090e, 0 8px 30px rgba(0,0,0,1)', color: 'var(--plum)', margin: '0 0 0.5rem 0' }}>Shadow &amp; Sanctuary</h1>
          <div className="tag" style={{ textShadow: '1px 1px 0 #0b090e, 0 4px 15px rgba(0,0,0,1)', color: 'var(--plum)', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)', padding: '0.6rem', display: 'inline-block', marginBottom: '2rem' }}>The wards hold fast. Identify yourself.</div>
          <div className="card" style={{ background: 'rgba(11,9,14,0.85)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', position: 'relative' }}>
            <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
            <Icon name="ph-lock" style={{ fontSize: '2.5rem', color: 'var(--plum)', marginBottom: '1rem', display: 'block' }} />
            <form onSubmit={handleLogin}>
              <input
                id="login-email"
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
                style={{ width: '100%', marginBottom: '0.75rem', padding: '0.6rem', boxSizing: 'border-box', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--fg)', borderRadius: '6px' }}
              />
              <input
                id="login-password"
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                style={{ width: '100%', marginBottom: '1rem', padding: '0.6rem', boxSizing: 'border-box', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--fg)', borderRadius: '6px' }}
              />
              {loginError && (
                <p style={{ color: 'var(--crimson-b)', marginBottom: '1rem', fontSize: '0.9rem' }}>{loginError}</p>
              )}
              <button id="login-submit" type="submit" className="btn plum" style={{ width: '100%', fontSize: '1.3rem', padding: '0.8rem 1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.8)' }} disabled={loginSubmitting}>
                {loginSubmitting ? 'Testing the Wards...' : 'Enter the Sanctuary'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (supabaseError) {
    return (
      <div className="land" style={{ backgroundColor: 'transparent' }}>
        <div className="scene" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem', position: 'relative', zIndex: 10 }}>
          <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
          <Icon name="ph-warning-circle" style={{fontSize: '3rem', color: 'var(--crimson-b)'}} />
          <h2 style={{marginTop: '1rem', marginBottom: '1rem'}}>Connection Severed</h2>
          <p style={{color: 'var(--dim)', marginBottom: '1rem'}}>The Apothecary Lounge cannot reach the Supabase backend. Please ensure your environment variables are configured correctly and the database is accessible.</p>
          <button className="btn plum" onClick={() => window.location.reload()}>Attempt Reconnection</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentScreen === 'loading' && (
        <div id="s-loading" className="land">
          <div className="tag" style={{ textShadow: '0 0 10px rgba(0,0,0,0.8)', color: 'var(--plum)' }}>Consulting the rites...</div>
        </div>
      )}

      {currentScreen === 'avatar' && (
        <div id="s-av" className="land">
          <ConjureVisage onFinish={() => { 
            const isCompletedLocally = localStorage.getItem('intake_completed') === 'true';
            if (!isCompletedLocally) {
              setCurrentScreen('intake');
            } else {
              setCurrentScreen('app'); 
              handleTabClick('rites'); 
            }
          }} />
        </div>
      )}

      {currentScreen === 'landing' && (
        <div id="s-land" className="land">
          <Landing 
            onProceed={(skipIntake) => {
              let hasAvatar = false;
              try {
                const conf = JSON.parse(localStorage.getItem('avatar_config'));
                if (conf && conf.name) hasAvatar = true;
              } catch(e) {}
              const hasIntake = localStorage.getItem('intake_completed') === 'true';
              if (!hasAvatar) setCurrentScreen('avatar');
              else if (!skipIntake && !hasIntake) setCurrentScreen('intake');
              else {
                setCurrentScreen('app');
                handleTabClick('rites');
              }
            }} 
            onOpenAvatar={() => setCurrentScreen('avatar')} 
          />
        </div>
      )}

      {currentScreen === 'intake' && (
        <div id="s-ins" className="land">
          <Intake onComplete={() => { setCurrentScreen('app'); handleTabClick('rites'); }} />
        </div>
      )}

      {currentScreen === 'app' && (
        <div id="s-app" style={{ position: 'relative', minHeight: '100vh' }}>
          <div style={{ position: 'relative', zIndex: 5 }}>
            <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', position: 'sticky', top: 0, zIndex: 40, background: 'transparent', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '0 0 auto' }}>
              <button onClick={handleReturnToCottage} title="Return to Sanctuary" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--plum)', padding: 0, opacity: activeTab === 'home' ? 0.5 : 1 }}>
                <Icon name="house" style={{fontSize: '1.4rem'}} />
              </button>
            </div>
            
            <div className="tabs" style={{ display: 'flex', justifyContent: 'center', flex: 1, gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none', padding: '0 0.3rem' }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`tb ${activeTab === t.id ? 'active on' : ''}`}
                  title={t.label}
                  onClick={() => handleTabClick(t.id)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Icon name={t.glyph} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', flex: '0 0 auto' }}>
              <button onClick={() => { if (settings.tts) speak("Configurations"); setShowSettings(true); }} title="Configurations" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--plum)', padding: 0 }}>
                <Icon name="ph-gear" style={{fontSize: '1.4rem'}} />
              </button>
            </div>
          </div>
            
            <div id="main-content">
              {renderActiveTabContent()}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div id="setmodal" className="modal" style={{ display: 'block', padding: '1rem' }}>
          <div className="modal-content card" style={{ maxWidth: '1000px', width: '95vw', maxHeight: '90vh', overflowY: 'auto', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
            <div className="corner tl"></div><div className="corner tr"></div>
            <div className="corner bl"></div><div className="corner br"></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>Sanctuary Tuning</h2>
                <div className="mt mb-4">Adjust the chamber's atmosphere.</div>
              </div>
              <button className="btn sm" onClick={() => setShowSettings(false)}>X</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {/* Left Column: Appearance */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>Sanctuary Tuning</h3>
                
                <div className="field" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Inscription Scale ({settings.fontSize}px)</label>
                  <input type="range" min="12" max="32" value={settings.fontSize} 
                         onChange={e => setSettings({...settings, fontSize: e.target.value})} />
                </div>
                
                <div className="field" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Ancient Script</label>
                  <select value={settings.fontFamily} onChange={e => setSettings({...settings, fontFamily: e.target.value})}>
                    <option value="Sacramento">Sacramento</option>
                    <option value="Alex Brush">Alex Brush</option>
                    <option value="Petit Formal Script">Petit Formal Script</option>
                    <option value="Meddon">Meddon</option>
                    <option value="Cormorant Garamond">Cormorant Garamond</option>
                    <option value="Alice">Alice</option>
                    <option value="Elsie">Elsie</option>
                    <option value="Lora">Lora</option>
                    <option value="Parisienne">Parisienne</option>
                    <option value="Allura">Allura</option>
                    <option value="Great Vibes">Great Vibes</option>
                    <option value="system-ui">Mortal Script (System)</option>
                  </select>
                </div>

                <div style={{ 
                  padding: '1rem', 
                  border: '1px dashed var(--border)', 
                  borderRadius: '8px',
                  background: 'var(--bg)',
                  marginTop: '1rem'
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--dim)', marginBottom: '0.5rem' }}>Scrying Glimpse:</div>
                  <div style={{ 
                    fontFamily: `"${settings.fontFamily}", serif`, 
                    fontSize: `${settings.fontSize}px`,
                    color: 'var(--crimson)'
                  }}>
                    The quick brown fox jumps over the lazy dog. 1234567890
                  </div>
                </div>
              </div>
              
              {/* Right Column: Ethereal Echoes & Conduits, then Danger Zone stacked below */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>Ethereal Echoes & Conduits</h3>

                <div className="field" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', }}>
                    <input type="checkbox" checked={settings.tts} 
                         onChange={e => {
                           setSettings({...settings, tts: e.target.checked});
                           setTtsEnabled(e.target.checked);
                         }} /> Awaken Ethereal Voice
                  </label>
                  
                  {settings.tts && (
                    <div style={{ display: 'flex', marginTop: '0.5rem', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.8rem' }}>Incantation Voice
                        <select style={{ width: '100%', marginTop: '0.2rem' }}
                                value={ttsOptions.voice}
                                onChange={e => {
                                  setTtsOptions({...ttsOptions, voice: e.target.value});
                                  setTtsVoiceURI(e.target.value);
                                }}>
                          {availableVoices.map(v => (
                            <option key={v.voiceURI} value={v.voiceURI}>{v.displayName}</option>
                          ))}
                        </select>
                      </label>
                      <label style={{ fontSize: '0.8rem' }}>Tempo of Speech
                        <input type="range" min="0.5" max="2.0" step="0.1" style={{ width: '100%' }}
                               value={ttsOptions.rate}
                               onChange={e => {
                                 const v = parseFloat(e.target.value);
                                 setTtsOptions({...ttsOptions, rate: v});
                                 setTtsRate(v);
                               }} />
                      </label>
                      <label style={{ fontSize: '0.8rem' }}>Vocal Resonance
                        <input type="range" min="0.5" max="2.0" step="0.1" style={{ width: '100%' }}
                               value={ttsOptions.pitch}
                               onChange={e => {
                                 const v = parseFloat(e.target.value);
                                 setTtsOptions({...ttsOptions, pitch: v});
                                 setTtsPitch(v);
                               }} />
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="field" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
                    <label className="settings-toggle">
                      <input type="checkbox" checked={settings.health} onChange={async (e) => {
                        const checked = e.target.checked;
                        if (checked) {
                          const { requestHealthPermissions, syncWearableSnapshot } = await import('./lib/health-connect.js');
                          const granted = await requestHealthPermissions();
                          if (granted) {
                            setSettings({...settings, health: true});
                            syncWearableSnapshot();
                          }
                        } else {
                          setSettings({...settings, health: checked});
                        }
                      }} /> Corporeal Sensors (RingConn, Renpho, Samsung)
                    </label>
                    
                    <label style={{ color: 'var(--crimson)', marginTop: '1rem' }}>
                      <input type="checkbox" checked={settings.cal}
                             onChange={e => setSettings({...settings, cal: e.target.checked})} /> Solar Almanac (Google Calendar)
                    </label>
                    {settings.cal && (
                      <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input type="text" placeholder="Google OAuth Client ID" value={settings.gcalClientId || ''} 
                               onChange={e => {
                                 setSettings({...settings, gcalClientId: e.target.value});
                                 if (e.target.value) {
                                   initGoogleCalendar(e.target.value, () => alert("The Solar Almanac is Bound!"));
                                 }
                               }} style={{ padding: '0.5rem', width: '100%' }} />
                        <button className="btn sm g" onClick={() => requestCalendarAccess()} style={{ width: 'fit-content' }}>Bind Solar Almanac</button>
                        <div className="mt" style={{ fontSize: '0.8rem' }}>Offer the Celestial ID to chart the wheel of the year.</div>
                      </div>
                    )}
                  </div>
                </div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--crimson)', textAlign: 'center' }}>Danger Zone</h3>

                <div>
                  <button onClick={() => {
                    alert('Glossary:\nAppSpeak Translation Guide\n\nCrown = Hair\nGaze = Eyes\nGrin = Mouth/Teeth\nVisage = Face\nVessel = Body\nSanctuary = App\nReliquary = Tools/Devices\nApothecary = Consumables', 'Glossary');
                  }} className="btn" style={{ width: '100%', marginBottom: '1rem', background: 'var(--card2)', borderColor: 'var(--plum)', color: 'var(--plum)' }}>Glossary of AppSpeak</button>
                  
                  <button onClick={() => {
                    setShowSettings(false);
                    setCurrentScreen('avatar');
                  }} className="btn plum" style={{ width: '100%', marginBottom: '1rem' }}>Reshape Visage (Avatar Builder)</button>

                  <button id="logout-btn" onClick={async () => {
                    if (await confirm("Do you wish to leave the Sanctuary for now? You may return with your credentials.")) {
                      setShowSettings(false);
                      await handleLogout();
                    }
                  }} className="btn" style={{ width: '100%', marginBottom: '1rem', background: 'var(--card2)', borderColor: 'var(--plum)', color: 'var(--plum)' }}>Leave the Sanctuary (Log Out)</button>

                  <button onClick={async () => {
                    if (await confirm("Do you truly wish to shatter the First Inscription? You will be cast back to the initial inquiry.")) {
                      try {
                        const { data: profile, error: profileErr } = await supabase.from('user_profile').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
                        if (profileErr) throw profileErr;
                        if (profile) {
                          const { error: updateErr } = await supabase.from('user_profile').update({ intake_completed: false }).eq('id', profile.id);
                          if (updateErr) throw updateErr;
                        }
                        setShowSettings(false);
                        setCurrentScreen('intake');
                      } catch (err) {
                        console.error('Failed to shatter inscription', err);
                        await alert('Failed to communicate with the Sanctuary. Please try again.');
                      }
                    }
                  }} className="btn g" style={{ width: '100%', marginBottom: '1rem' }}>Shatter the First Inscription</button>

                  <button onClick={async () => {
                    if (await confirm("Do you truly wish to raze this Sanctuary to ash? All saved rites, items, and settings shall be lost to the void. This cannot be undone.", "Danger")) {
                      try {
                        const { error: profileErr } = await supabase.from('user_profile').delete().not('id', 'is', null);
                        if (profileErr) throw profileErr;
                        await supabase.from('somatic_reactions').delete().not('id', 'is', null);
                        await supabase.from('shadowtome_elixirs').delete().not('id', 'is', null);
                        await supabase.from('journal_entries').delete().not('id', 'is', null);
                        await supabase.from('routine_history').delete().not('id', 'is', null);
                        await supabase.from('appointments').delete().not('id', 'is', null);
                        await supabase.from('isotretinoin_log').delete().not('id', 'is', null);
                        await supabase.from('codex_entries').delete().eq('is_permanent', false);
                        await supabase.from('items').delete().not('id', 'is', null);
                      } catch (err) {
                        console.error('Failed to erase Codex', err);
                        await alert('Failed to erase Codex. Continuing local wipe.');
                      }
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }
                  }} className="btn g" style={{ width: '100%' }}>Raze the Sanctuary to Ash</button>
                </div>
                
                <button onClick={() => saveSettings(settings)} className="btn full plum" style={{ marginTop: '2rem', padding: '1rem', fontSize: '1.2rem' }}>Bind the Runes of Power</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
