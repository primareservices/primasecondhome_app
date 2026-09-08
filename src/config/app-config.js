export const APP_NAME = 'PRIMA SECOND HOME';
export const APP_SHORT = 'PRIMA Home';
export const APP_VERSION = 'v0.1.0';
export const APP_ENV = import.meta.env.VITE_APP_ENV || 'production';
export const IS_STAGING = APP_ENV === 'staging';
// DEMO režim: bez Supabase URL beží appka nad localStorage (src/data/demo-store.js).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const DEMO_MODE = !SUPABASE_URL;

// Manrope pokrýva latinku, cyriliku aj vietnamčinu; dévanágarí (hi, ne) padá na Noto Sans Devanagari.
export const fontFamily = "'Manrope', 'Noto Sans Devanagari', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
// Čísla (izba, referencie, časy) nie sú v monospace — Manrope 800 s tabulkovými číslicami.
export const monoFamily = fontFamily;

export const shadow = {
  sm: '0 1px 2px rgba(23,22,26,0.04), 0 10px 30px rgba(23,22,26,0.06)',
  md: '0 1px 2px rgba(23,22,26,0.04), 0 12px 34px rgba(23,22,26,0.10)',
  lg: '0 22px 44px rgba(74,15,27,0.28)',
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
  // Rezervačný systém cudzineckej polície (OCP) — vstupná stránka MV SR; presnú adresu overí office (docs/RESEARCH-TARIF.md).
  foreignPoliceUrl: 'https://www.minv.sk/?cudzinecka-policia',
  emergency: { general: '112', ambulance: '155', fire: '150', police: '158' },
};
