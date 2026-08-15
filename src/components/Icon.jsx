import React from 'react';
import { ic } from '../lib/custom-icons.jsx';

export default function Icon({ name, ...props }) {
  if (!name) return null;
  
  // Strip 'ph-' prefix if present, since custom-icons.js falls back to ph-
  const finalName = name.startsWith('ph-') ? name.slice(3) : name;
  
  return (
    <span 
      style={{ display: 'inline-flex', alignItems: 'center', filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))', ...props.style }} 
      {...props}
    >
      {ic(finalName)}
    </span>
  );
}

