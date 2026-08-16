import React, { useState, useEffect } from 'react';
import Icon from './Icon.jsx';

export default function AppLock({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  
  // Quick setup: If no PIN is set, allow them to set one.
  const [isSettingPin, setIsSettingPin] = useState(false);
  const existingPin = localStorage.getItem('sanctuary_pin');

  useEffect(() => {
    if (!existingPin) {
      setIsSettingPin(true);
    }
  }, [existingPin]);

  const handleDigit = (d) => {
    setError('');
    if (pin.length < 4) {
      const newPin = pin + d;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (isSettingPin) {
          localStorage.setItem('sanctuary_pin', newPin);
          setIsSettingPin(false);
          setPin('');
          onUnlock(); // Unlocked immediately after setting
        } else {
          if (newPin === existingPin) {
            setPin('');
            onUnlock();
          } else {
            setError('The Gate Remains Sealed.');
            setPin('');
          }
        }
      }
    }
  };

  const handleClear = () => setPin('');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Icon name="sparkles" style={{ fontSize: '4rem', color: 'var(--gold)', marginBottom: '1rem' }} />
      <h2 style={{ color: 'var(--plum)', marginBottom: '0.5rem', textAlign: 'center' }}>The Sanctuary Gate</h2>
      <p style={{ color: 'var(--dim)', marginBottom: '2rem', textAlign: 'center' }}>
        {isSettingPin ? 'Engrave a 4-digit ward to secure the gate.' : 'Present your ward to unseal the Sanctuary.'}
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--plum)', background: i < pin.length ? 'var(--plum)' : 'transparent' }}></div>
        ))}
      </div>
      
      {error && <div style={{ color: 'var(--crimson)', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {[1,2,3,4,5,6,7,8,9].map(d => (
          <button key={d} className="btn" style={{ padding: '1.5rem', fontSize: '1.5rem', borderRadius: '50%', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleDigit(d.toString())}>{d}</button>
        ))}
        <div></div>
        <button className="btn" style={{ padding: '1.5rem', fontSize: '1.5rem', borderRadius: '50%', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleDigit('0')}>0</button>
        <button className="btn" style={{ padding: '1.5rem', fontSize: '1.2rem', borderRadius: '50%', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'var(--dim)' }} onClick={handleClear}><Icon name="ph-backspace" /></button>
      </div>
    </div>
  );
}
