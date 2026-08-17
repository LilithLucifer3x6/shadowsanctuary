import React from 'react';
import Icon from './Icon.jsx';

export const TAXONOMY_ZONES = [
  'Crown', 'Visage-above', 'Visage-midway', 'Visage-below', 
  'Gaze', 'Grin', 'Veil', 'Vessel-underarm', 
  'Vessel-chest/back', 'Vessel-arms/legs', 'Vessel-hands/feet', 'Vessel-general'
];

export default function ZoneSelector({ selectedZones, onChange }) {
  const toggleZone = (zone) => {
    const arr = selectedZones || [];
    if (arr.includes(zone)) {
      onChange(arr.filter(z => z !== zone));
    } else {
      onChange([...arr, zone]);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
      {TAXONOMY_ZONES.map(z => {
        const isSelected = (selectedZones || []).includes(z);
        return (
          <button 
            key={z} 
            className={`btn sm ${isSelected ? 'plum' : ''}`}
            onClick={(e) => { e.preventDefault(); toggleZone(z); }}
            style={{ 
              textAlign: 'left', 
              padding: '0.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              background: isSelected ? 'var(--plum)' : 'var(--card2)',
              color: isSelected ? '#000' : 'var(--text)'
            }}
          >
            {isSelected ? <Icon name="ph-check-circle" weight="fill" /> : <Icon name="ph-circle" />}
            <span style={{ fontSize: '0.75rem' }}>{z}</span>
          </button>
        );
      })}
    </div>
  );
}
