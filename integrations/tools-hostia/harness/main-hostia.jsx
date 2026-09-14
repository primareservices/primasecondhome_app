// Harness: modul Hostia mimo obalu TOOLS (bez prihlásenia do TOOLS), rovnaké tokeny a globálne štýly.
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import GlobalStyles from './ui/GlobalStyles.jsx';
import { fontFamily } from './ui/tokens.js';
import Hostia from './modules/hostia/index.jsx';

const ctx = { me: { email: 'recepcia@primare.sk' }, grants: ['modul:hostia'], isAdmin: true, can: () => true, reloadProfil: () => {} };
createRoot(document.getElementById('root')).render(
  <>
    <GlobalStyles/>
    <div style={{ fontFamily, maxWidth: 1180, margin: '0 auto', padding: '20px 24px' }}>
      <Suspense fallback={null}><Hostia module={{ id: 'hostia' }} ctx={ctx}/></Suspense>
    </div>
  </>
);
