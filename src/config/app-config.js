export const APP_NAME = 'PRIMA SECOND HOME';
export const APP_SHORT = 'PRIMA Home';
export const APP_VERSION = 'v0.1.0';
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'production';
export const IS_STAGING = APP_ENV === 'staging';
// DEMO režim: bez Supabase URL beží appka nad localStorage (src/data/demo-store.js).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const DEMO_MODE = !SUPABASE_URL;

export const fontFamily = "'Inter', 'Noto Sans Devanagari', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
export const monoFamily = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace";

export const shadow = {
  sm: '0 1px 2px rgba(17,24,39,0.04), 0 1px 1px rgba(17,24,39,0.02)',
  md: '0 4px 12px rgba(17,24,39,0.06), 0 1px 3px rgba(17,24,39,0.04)',
  lg: '0 12px 32px rgba(17,24,39,0.10), 0 4px 12px rgba(17,24,39,0.06)',
};

// Kontakty spoločné pre celú sieť (verejné údaje z primare.sk / ubytovnaprima.sk).
export const NETWORK = {
  officePhone: '+421 2 3310 4420',
  officeEmail: 'office@primare.sk',
  confirmationsEmail: 'office@ubytovnaprima.sk',
  confirmationsPhone: '+421 905 241 094',
  web: 'https://primare.sk',
  iomPhone: '0850 211 478',
  iomWeb: 'https://mic.iom.sk',
  emergency: { general: '112', ambulance: '155', fire: '150', police: '158' },
};
