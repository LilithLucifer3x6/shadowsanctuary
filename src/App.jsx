import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase.js';
import { G, verifyGlyphs } from './lib/icons.jsx';
import { useDialog } from './components/Dialogs.jsx';
import { speak, getTtsEnabled, getTtsRate, getTtsPitch, getTtsVoiceURI, setTtsEnabled, setTtsRate, setTtsPitch, setTtsVoiceURI, getFeminineVoices } from './lib/tts.js';
import Icon from './components/Icon.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { initGoogleCalendar, requestCalendarAccess } from './lib/gcal.js';
import { syncWearableSnapshot } from './lib/health-connect.js';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { initEngineRules } from './lib/routine-engine.js';

import Landing from './screens/Landing.jsx';
import Intake from './screens/Intake.jsx';
import Rites from './screens/Rites.jsx';
import KeeperAvatar from './components/KeeperAvatar.jsx';
import Grimoire from './screens/Grimoire.jsx';
import Altars from './screens/Altars.jsx';
import Rootwork from './screens/Rootwork.jsx';
import Scrying from './screens/Scrying.jsx';
import ShadowTome from './screens/ShadowTome.jsx';
import AppLock from './components/AppLock.jsx';

const TABS = [
  { id: 'rites', label: 'The Mortal Rites', glyph: G.tabRites, bgName: 'action_mortal_rites', pose: 'working' },
  { id: 'grim', label: 'The Grimoire', glyph: G.tabGrim, bgName: 'action_grimoire', pose: 'reading' },
  { id: 'altars', label: 'The Altars', glyph: G.tabAltars, bgName: 'action_altars', pose: 'meditating' },
  { id: 'root', label: 'The Rootwork', glyph: G.tabRoot, bgName: 'action_rootwork', pose: 'working' },
  { id: 'pool', label: 'The Scrying Pool', glyph: G.tabPool, bgName: 'action_scrying_pool', pose: 'scrying' },
  { id: 'tome', label: 'The Shadow Tome', glyph: G.tabTome, bgName: 'action_shadow_tome', pose: 'reading' }
];

function getSpellDate() {
  const d = new Date();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const day = d.getDate();
  const suffix = ['th','st','nd','rd'][(day % 10 > 3) ? 0 : (day % 100 - day % 10 !== 10) * day % 10];
  return `${day}${suffix} of ${months[d.getMonth()]}`;
}

export default function App() {
  const { alert, confirm, confirmDestructive } = useDialog();
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
  const [isLocked, setIsLocked] = useState(window.location.search.includes('bypass') ? false : !!localStorage.getItem('avatar_config')); // lock if user has finished onboarding
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useEffect(() => {
    const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Settings state
  const [settings, setSettings] = useState({
    ttsEnabled: true,
    fontFamily: 'Elsie',
    cal: false,
    gcalClientId: '219612221408-dtdk611jt792pt9cq911f530fvqffmoc.apps.googleusercontent.com'
  });

  const [session, setSession] = useState({ user: { id: 'dummy' } });
  const [authLoading, setAuthLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState('');
  
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
    if (error) {
      setLoginError(error.message);
    }
    setLoginSubmitting(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotStatus('');
    if (!forgotEmail.trim()) {
      setForgotStatus('Please enter your email address.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin
    });
    if (error) {
      setForgotStatus(`Error: ${error.message}`);
    } else {
      setForgotStatus('A reset link has been dispatched to your email. Check your inbox.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.clear();
  };

  useEffect(() => {
    sessionStorage.setItem('al_currentScreen', currentScreen);
    if (currentScreen === 'landing' || currentScreen === 'avatar') {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = 'var(--bg)';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
    } else if (currentScreen === 'intake') {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = 'var(--bg)';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
    }
  }, [currentScreen]);

  useEffect(() => {
    const handleBackground = () => {
      if (localStorage.getItem('avatar_config')) {
        setIsLocked(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBackground();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    let stateListener;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) handleBackground();
      }).then(listener => {
        stateListener = listener;
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (stateListener) stateListener.remove();
    };
  }, []);

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
        const ratio = isLandscape ? '169' : '916';
        bgUrl = tab ? `/assets/avatar-tests/part5_${ratio}_${tab.bgName}.png` : `/assets/avatar-tests/part5_${ratio}_action_mortal_rites.png`;
      }

      document.body.style.backgroundImage = `url('${bgUrl}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundColor = 'var(--bg)';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
    } else {
      document.body.style.backgroundImage = 'none';
    }
  }, [activeTab, currentScreen, isLandscape]);

  useEffect(() => {
    verifyGlyphs();
    
    // Load Settings
    const saved = JSON.parse(localStorage.getItem('app_settings') || '{"fontSize":"18","fontFamily":"Sacramento","tts":false,"health":false,"cal":false}');
    if (!saved.gcalClientId) saved.gcalClientId = '219612221408-dtdk611jt792pt9cq911f530fvqffmoc.apps.googleusercontent.com';
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
          if (!s.gcalClientId) s.gcalClientId = '219612221408-dtdk611jt792pt9cq911f530fvqffmoc.apps.googleusercontent.com';
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

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  if (typeof window !== 'undefined') {
    window.setCurrentScreen = setCurrentScreen;
    window.handleTabClick = handleTabClick;
  }

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
      case 'rites': return <ErrorBoundary fallbackLabel="The Mortal Rites"><Rites pose={pose} /></ErrorBoundary>;
      case 'grim': return <ErrorBoundary fallbackLabel="The Grimoire"><Grimoire pose={pose} /></ErrorBoundary>;
      case 'altars': return <ErrorBoundary fallbackLabel="The Altars"><Altars pose={pose} /></ErrorBoundary>;
      case 'root': return <ErrorBoundary fallbackLabel="The Rootwork"><Rootwork pose={pose} /></ErrorBoundary>;
      case 'pool': return <ErrorBoundary fallbackLabel="The Scrying Pool"><Scrying pose={pose} /></ErrorBoundary>;
      case 'tome': return <ErrorBoundary fallbackLabel="The Shadow Tome"><ShadowTome pose={pose} /></ErrorBoundary>;
      default: return null;
    }
  };

  if (window.location.search.includes('test_scrying=1')) {
    return (
      <div className="land">
        <ErrorBoundary fallbackLabel="The Scrying Pool">
          <Scrying pose="scrying" />
        </ErrorBoundary>
      </div>
    );
  }

  if (window.location.search.includes('test_grim=1')) {
    return (
      <div className="land">
        <ErrorBoundary fallbackLabel="The Grimoire">
          <Grimoire pose="reading" />
        </ErrorBoundary>
      </div>
    );
  }

  if (window.location.search.includes('test_root=1')) {
    return (
      <div className="land">
        <Rootwork />
      </div>
    );
  }

  if (window.location.search.includes('test_rites=1')) {
    return (
      <div className="land">
        <Rites />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="land" style={{ backgroundImage: 'url("/assets/avatar-tests/part5_169_action_manor_exterior.png")', backgroundSize: 'cover', backgroundColor: 'var(--bg)', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <div className="tag" style={{ textShadow: '1px 1px 0 #0b090e, 0 4px 15px rgba(0,0,0,1)', color: 'var(--plum)', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)', padding: '0.6rem', display: 'inline-block' }}>Consulting the wards...</div>
        </div>
      </div>
    );
  }

  if (window.location.search.includes('bypass') ? false : (!session?.user || session.user.id === 'dummy')) {
    return (
      <div className="land" style={{ backgroundImage: 'url("/assets/avatar-tests/part5_169_action_manor_exterior.png")', backgroundSize: 'cover', backgroundColor: 'var(--bg)', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1 }}></div>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '2rem', maxWidth: '400px', width: '90%' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 10vw, 3.5rem)', textShadow: '2px 2px 0 #0b090e, -1px -1px 0 #0b090e, 1px -1px 0 #0b090e, -1px 1px 0 #0b090e, 0 8px 30px rgba(0,0,0,1)', color: 'var(--plum)', margin: '0 0 0.5rem 0' }}>
            Shadow &amp; Sanctuary
          </h1>
          <Icon name="ph-lock" style={{fontSize: '2rem', color: 'var(--plum)', marginBottom: '0.5rem'}} />
          <div className="tag" style={{ fontSize: '1rem', textShadow: '1px 1px 0 #0b090e, 0 4px 15px rgba(0,0,0,1)', color: 'var(--plum)', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)', padding: '0.6rem', display: 'inline-block', marginBottom: '1.5rem' }}>
            The wards hold fast. Identify yourself.
          </div>
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
              <p style={{ color: 'var(--crimson-b)', marginBottom: '1rem', fontSize: '0.9rem', background: 'rgba(0,0,0,0.6)', padding: '0.5rem', borderRadius: '4px' }}>{loginError}</p>
            )}
            <button id="login-submit" type="submit" className="btn plum" style={{ width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.8)' }} disabled={loginSubmitting}>
              {loginSubmitting ? 'Testing the Wards...' : 'Enter'}
            </button>
          </form>
          <button
            onClick={() => { setShowForgotPassword(true); setForgotEmail(loginEmail); setForgotStatus(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--plum)', cursor: 'pointer', fontSize: '0.85rem', marginTop: '1rem', textDecoration: 'underline', opacity: 0.8 }}
          >
            Lost your key to the Sanctuary?
          </button>

          {showForgotPassword && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.6)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--dim)', marginBottom: '0.75rem' }}>Enter your email and we will send a reset link.</div>
              <form onSubmit={handleForgotPassword}>
                <input
                  type="email"
                  placeholder="Email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                  style={{ width: '100%', marginBottom: '0.75rem', padding: '0.6rem', boxSizing: 'border-box', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--fg)', borderRadius: '6px' }}
                />
                {forgotStatus && (
                  <p style={{ color: forgotStatus.startsWith('Error') ? 'var(--crimson-b)' : 'var(--plum)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{forgotStatus}</p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn plum" style={{ flex: 1 }}>Send Reset Link</button>
                  <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowForgotPassword(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
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

      {currentScreen === 'landing' && (
        <div id="s-land">
          <Landing 
            onProceed={(skipIntake) => {
              const hasIntake = localStorage.getItem('intake_completed') === 'true';
              if (!skipIntake && !hasIntake) setCurrentScreen('intake');
              else {
                setCurrentScreen('app');
                handleTabClick('rites');
              }
            }} 
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
            <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', position: 'sticky', top: 0, zIndex: 40, background: 'linear-gradient(to bottom, rgba(18,5,24,0.95) 0%, rgba(18,5,24,0.6) 60%, transparent 100%)', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
            
            <div id="main-content" style={{ position: 'relative', zIndex: 10 }}>
              {renderActiveTabContent()}
            </div>
            
            {/* The Static Composited Keeper Avatar (Removed as the new 9:16 backgrounds natively embed the avatar) */}
          </div>
        </div>
      )}

      {showSettings && (
        <div id="setmodal" className="modal-overlay" onClick={(e) => { if(e.target.id === 'setmodal') setShowSettings(false); }}>
          <div className="modal card" style={{ maxWidth: '1000px', width: '95vw', padding: '2rem' }}>
            <div className="corner tl"></div><div className="corner tr"></div>
            <div className="corner bl"></div><div className="corner br"></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <h2 style={{ textAlign: 'center' }}>Sanctuary Tuning</h2>
                <div className="mt mb-4" style={{ textAlign: 'center' }}>Adjust the chamber's atmosphere.</div>
              </div>
              <button className="btn sm" onClick={() => setShowSettings(false)}>X</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {/* Left Column: Appearance */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>Sanctuary Tuning</h3>
                
                <div className="field" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Inscription Scale: {settings.fontSize}px</label>
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
                    <option value="system-ui">Mortal Script</option>
                  </select>
                </div>
                
                <div style={{ 
                  padding: '1rem', 
                  border: '1px solid var(--border)', 
                  borderRadius: '12px',
                  background: 'rgba(25, 23, 26, 0.5)',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--plum)' }}>Scrying Glimpse</div>
                  <div style={{ 
                    fontFamily: settings.fontFamily, 
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: '1.4',
                    padding: '1rem',
                    background: 'var(--card2)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    As above, so below.
                  </div>
                </div>

                <button onClick={() => {
                  alert('Glossary:\nAppSpeak Translation Guide\n\nCrown = Hair\nGaze = Eyes\nGrin = Mouth/Teeth\nVisage = Face\nForm = Body\nSanctuary = App\nReliquary = Tools/Devices\nApothecary = Consumables', 'Glossary');
                }} className="btn" style={{ width: '100%', marginBottom: '1rem', background: 'var(--card2)', borderColor: 'var(--plum)', color: 'var(--plum)' }}>Glossary of AppSpeak</button>
              </div>
              
              {/* Right Column: Ethereal Echoes & Conduits, then Danger Zone stacked below */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>Ethereal Echoes & Conduits</h3>

                <div className="field" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem', width: '100%', maxWidth: '300px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <input type="checkbox" style={{ marginTop: '0.2rem' }} checked={settings.tts} 
                           onChange={e => {
                             setSettings({...settings, tts: e.target.checked});
                             setTtsEnabled(e.target.checked);
                           }} /> Awaken Ethereal Voice
                    </label>
                    
                    {settings.tts && (
                      <div style={{ display: 'flex', marginLeft: '1.5rem', marginTop: '0.5rem', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
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

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" style={{ marginTop: '0.2rem' }} checked={settings.health} onChange={async (e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            const { requestHealthPermissions, syncWearableSnapshot } = await import('./lib/health-connect.js');
                            const granted = await requestHealthPermissions();
                            if (granted) {
                              setSettings({...settings, health: true});
                              syncWearableSnapshot();
                            }
                          } else {
                            setSettings({...settings, health: false});
                          }
                        }} /> <span style={{ color: 'var(--text)' }}>Corporeal Sensors</span>
                      </label>
                      
                      {settings.health && (
                        <div style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
                          <button className="btn sm g" onClick={async (e) => {
                            const btn = e.target;
                            const ogText = btn.textContent;
                            btn.textContent = 'Syncing...';
                            const { syncWearableSnapshot } = await import('./lib/health-connect.js');
                            await syncWearableSnapshot();
                            btn.textContent = 'Synced';
                            setTimeout(() => { btn.textContent = ogText; }, 2000);
                          }}>Sync Now</button>
                        </div>
                      )}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--crimson)' }}>
                      <input type="checkbox" style={{ marginTop: '0.2rem' }} checked={settings.travel_mode || false} onChange={e => setSettings({...settings, travel_mode: e.target.checked})} />
                      Travel or Disruption Mode: Suppress Non-Essential Notifications
                    </label>
                    
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: 'var(--crimson)' }}>
                      <input type="checkbox" style={{ marginTop: '0.2rem' }} checked={settings.cal}
                             onChange={e => setSettings({...settings, cal: e.target.checked})} /> Solar Almanac (Google Calendar)
                    </label>
                    {settings.cal && (
                      <div style={{ marginLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                        <input type="text" placeholder="Google OAuth Client ID" value={settings.gcalClientId || ''} 
                               onChange={e => {
                                 setSettings({...settings, gcalClientId: e.target.value});
                                 if (e.target.value) {
                                   initGoogleCalendar(e.target.value, () => alert("The Solar Almanac is Bound!"));
                                 }
                               }} style={{ padding: '0.5rem', width: '100%' }} />
                        <div style={{ display: 'flex', justifyContent: 'center' }}><button className="btn sm g" onClick={() => requestCalendarAccess()} style={{ width: 'fit-content' }}>Bind Solar Almanac</button></div>
                        <div className="mt" style={{ fontSize: '0.8rem' }}>Offer the Celestial ID to chart the wheel of the year.</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', textAlign: 'center' }}>Sanctuary Gate</h3>


                  <button onClick={async () => {
                    if (await confirm("Leave the Sanctuary? You'll need to sign in again to return.")) {
                      await handleLogout();
                    }
                  }} className="btn" style={{ width: '100%', marginBottom: '0', background: 'var(--card2)', borderColor: 'var(--crimson)', color: 'var(--crimson)' }}>Leave the Sanctuary</button>
                </div>
                
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--crimson)', textAlign: 'center' }}>Danger Zone</h3>

                <div>


                  <button onClick={async () => {
                    if (await confirmDestructive("Do you truly wish to shatter the First Inscription? You will be cast back to the initial inquiry.")) {
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
                    if (await confirmDestructive("Do you truly wish to raze this Sanctuary to ash? All saved rites, items, and settings shall be lost to the void. This cannot be undone.")) {
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
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', width: '100%', paddingBottom: '1rem' }}>
              <button onClick={() => saveSettings(settings)} className="btn plum" style={{ marginTop: '0', padding: '1rem', fontSize: '1.2rem' }}>Bind the Runes of Power</button>
            </div>
          </div>
        </div>
      )}
      {isLocked && <AppLock onUnlock={() => setIsLocked(false)} />}
    </>
  );
}







