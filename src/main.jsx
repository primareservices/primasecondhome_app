// Písma sú súčasťou buildu (offline PWA, žiadne volanie na Google Fonts). Poppins = písmo značky
// (latinka + dévanágarí), Montserrat = sekundárne písmo manuálu a záloha pre cyriliku a vietnamčinu.
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
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
