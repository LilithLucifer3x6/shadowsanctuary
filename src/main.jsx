import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { DialogProvider } from './components/Dialogs.jsx';
import '@phosphor-icons/web/duotone';
import '@phosphor-icons/web/regular';
import './design-tokens.css';
import './styles/overrides.css';

import { buildBaseRoutines } from './lib/routine-engine.js';
window.buildBaseRoutines = buildBaseRoutines;

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </React.StrictMode>
);
