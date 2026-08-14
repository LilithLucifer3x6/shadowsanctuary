import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import Icon from '../components/Icon.jsx';
import { G } from '../lib/icons.jsx';

export default function Landing({ onProceed, onOpenAvatar }) {
  const [hasProfile, setHasProfile] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState(null);

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('avatar_config');
      if (savedConfig) {
        setAvatarConfig(JSON.parse(savedConfig));
      }
    } catch(e) {}
    
    const isCompletedLocally = localStorage.getItem('intake_completed') === 'true';
    if (isCompletedLocally) {
      setHasProfile(true);
      onProceed(true);
    } else {
      supabase.from('user_profile').select('intake_completed').maybeSingle().then(({ data }) => {
        if (data && data.intake_completed) {
          localStorage.setItem('intake_completed', 'true');
          setHasProfile(true);
          onProceed(true);
        } else {
          setHasProfile(false);
        }
      });
    }
  }, []);

  return (
    <div className="land" style={{ 
        backgroundImage: 'url("/assets/avatar-tests/part3_916_manor_exterior.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
    }}>
      {/* Background Overlay to ensure text readability */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1 }}></div>

      {/* Avatar Dynamic Overlay (Removed as the new 9:16 background natively embeds the avatar) */}

      {/* Main UI Container — no card box, text sits directly over the background */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '1rem' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', textShadow: '2px 2px 0 #0b090e, -1px -1px 0 #0b090e, 1px -1px 0 #0b090e, -1px 1px 0 #0b090e, 0 8px 30px rgba(0,0,0,1)', color: 'var(--plum)', margin: '0 0 0.2rem 0' }}>
            Shadow & Sanctuary
          </h1>
          <div className="tag" style={{ fontSize: '1rem', textShadow: '1px 1px 0 #0b090e, 0 4px 15px rgba(0,0,0,1)', color: 'var(--plum)', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)', padding: '0.4rem', display: 'inline-block', marginBottom: '1rem' }}>
            A sanctuary of self-care.
          </div>
          
          {hasProfile && avatarConfig && (
            <div style={{ fontSize: '1.4rem', color: 'var(--gold)', textShadow: '0 2px 5px rgba(0,0,0,0.9)', marginBottom: '2rem' }}>
              Welcome back, {avatarConfig.name}.
            </div>
          )}

          {!hasProfile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <button className="btn" onClick={() => onProceed(false)} style={{ fontSize: '1.2rem', padding: '0.8rem 2rem', width: '250px' }}>
                <Icon name={G.sparkles || 'sparkles'} /> The First Inscription
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onProceed(true)} 
              className="btn" 
              style={{ fontSize: '1.3rem', padding: '0.8rem 1.5rem', background: 'var(--card2)', borderColor: 'var(--plum)', color: 'var(--plum)', boxShadow: '0 4px 15px rgba(0,0,0,0.8)', width: '250px' }}
            >
              Enter the Sanctuary
            </button>
          )}
      </div>
    </div>
  );
}


