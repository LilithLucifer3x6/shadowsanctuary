import React, { useState, useRef } from 'react';
import Icon from './Icon.jsx';
import { invokeAnthropicProxy } from '../lib/ai-engine.js';

export default function VisualInscription({ onComplete, onSkip, inline = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiObservation, setAiObservation] = useState('');
  const [userOverride, setUserOverride] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Resize and compress
          const MAX_SIZE = 1024;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      
      const compressedDataUrl = await processImage(file);
      setImagePreview(compressedDataUrl);

      // Extract just the base64 part for Claude
      const base64Data = compressedDataUrl.split(',')[1];

      const messages = [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Data
              }
            },
            {
              type: "text",
              text: "You are the Keeper of the Grimoire. Look at this close-up photo of the user's skin, hair, or vessel. Provide a highly concise, purely visual description of what you see ('Red, raised bumps on the cheeks', 'Dry, flaky patches along the scalp'). Do NOT attempt to diagnose it or name a medical condition (do not say 'acne' or 'psoriasis'). Speak in a gentle, observant tone."
            }
          ]
        }
      ];

      const reply = await invokeAnthropicProxy(messages);
      setAiObservation(reply);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("The scrying pool was clouded. Please try again.");
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    onComplete(userOverride.trim() || aiObservation);
  };

  return (
    <div className={`card ${inline ? '' : 'scrying-pool'}`} style={{ padding: '2rem', textAlign: 'center' }}>
      {!inline && (
        <>
          <div className="corner tl"></div><div className="corner tr"></div><div className="corner bl"></div><div className="corner br"></div>
        </>
      )}
      
      {!aiObservation && !loading && (
        <div>
          <Icon name="ph-camera" style={{ fontSize: '3rem', color: 'var(--plum)', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '1rem', color: 'var(--plum)' }}>The Aura Scrying</h2>
          <p style={{ color: 'var(--dim)', marginBottom: '2rem' }}>
            Present your current form to the scrying pool. The Keeper will observe the physical signs, but will not diagnose them.
          </p>
          
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          
          <button className="btn plum" style={{ width: '100%', marginBottom: '1rem', padding: '1rem', fontSize: '1.2rem' }} onClick={() => fileInputRef.current?.click()}>
            Reveal to the Keeper
          </button>
          
          {onSkip && (
            <button className="btn" onClick={onSkip} style={{ width: '100%', background: 'var(--card2)', color: 'var(--dim)', borderColor: 'var(--border)' }}>
              Pass in Silence
            </button>
          )}
        </div>
      )}

      {loading && (
        <div>
          <Icon name="ph-spinner-gap" style={{ fontSize: '3rem', color: 'var(--plum)', animation: 'spin 2s linear infinite', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--dim)' }}>The Keeper is gazing into the scrying pool...</p>
        </div>
      )}

      {error && (
        <div>
          <Icon name="ph-warning-circle" style={{ fontSize: '3rem', color: 'var(--crimson-b)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--crimson-b)', marginBottom: '1rem' }}>{error}</p>
          <button className="btn plum" onClick={() => { setError(null); setImagePreview(null); }}>Try Again</button>
        </div>
      )}

      {aiObservation && !loading && (
        <div style={{ textAlign: 'center' }}>
          {imagePreview && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img src={imagePreview} alt="Scrying Result" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--plum)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }} />
            </div>
          )}
          
          <p style={{ fontStyle: 'italic', color: 'var(--dim)', marginBottom: '1.5rem', lineHeight: '1.6', background: 'var(--card2)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--plum)' }}>
            "{aiObservation}"
          </p>
          
          <p style={{ marginBottom: '1rem', color: 'var(--fg)' }}>
            Does this resonate? If a healer has already named this condition for you, speak its true name now.
          </p>
          
          <input 
            type="text" 
            placeholder="Cystic Acne, Psoriasis, Eczema"
            value={userOverride}
            onChange={(e) => setUserOverride(e.target.value)}
            style={{ width: '100%', marginBottom: '1.5rem', padding: '0.8rem', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)', borderRadius: '6px' }}
          />
          
          <button className="btn plum" style={{ width: '100%', marginBottom: '1rem' }} onClick={handleSubmit}>
            {userOverride.trim() ? 'Inscribe True Name' : 'Accept Keeper\'s Observation'}
          </button>
          
          <button className="btn" onClick={() => { setAiObservation(''); setImagePreview(null); }} style={{ width: '100%', background: 'transparent', color: 'var(--dim)', border: 'none' }}>
            Retake Photo
          </button>
        </div>
      )}
    </div>
  );
}
