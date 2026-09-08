// Písma sú súčasťou buildu (offline PWA, žiadne volanie na Google Fonts): Manrope pre latinku,
// cyriliku a vietnamčinu; Noto Sans Devanagari pre hindčinu a nepálčinu.
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/noto-sans-devanagari/400.css';
import '@fontsource/noto-sans-devanagari/600.css';
import '@fontsource/noto-sans-devanagari/700.css';
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
