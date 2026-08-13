import React from 'react';

export default function KeeperAvatar({ config, scale = 1, style = {} }) {
  if (!config || !config.layers) return null;

  return (
    <div style={{
      position: 'relative', 
      width: `${280 * scale}px`, 
      height: `${380 * scale}px`,
      ...style
    }}>
      {/* Base Body Anchor */}
      <img 
        src="/assets/avatar-tests/transparent/anchor_body_corrected_v5555_transparent.png" 
        alt="Base Body" 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} 
      />
      
      {/* Robe Layer */}
      {config.layers.robe && (
        <img 
          src={`/assets/avatar-tests/transparent/${config.layers.robe}`}
          alt="Robe" 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }} 
        />
      )}

      {/* Hair Layer */}
      {config.layers.hair && (
        <img 
          src={`/assets/avatar-tests/transparent/${config.layers.hair}`}
          alt="Hair" 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 3 }} 
        />
      )}

      {/* Jewelry Layer */}
      {config.layers.jewelry && (
        <img 
          src={`/assets/avatar-tests/transparent/${config.layers.jewelry}`}
          alt="Jewelry" 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 4 }} 
        />
      )}
    </div>
  );
}
