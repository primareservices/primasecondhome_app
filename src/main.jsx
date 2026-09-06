import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App.jsx';

// Service worker: autoUpdate + skipWaiting (vite.config.js). Reload robí appka pri controllerchange.
registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App/>
  </StrictMode>,
);
