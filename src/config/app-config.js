export const APP_NAME = 'PRIMA SECOND HOME';
export const APP_SHORT = 'PRIMA Home';
export const APP_VERSION = 'v0.4.1';
// (import.meta.env && …) — v node testoch import.meta.env neexistuje; Vite výraz aj tak nahradí.
export const APP_ENV = (import.meta.env && import.meta.env.VITE_APP_ENV) || 'production';
export const IS_STAGING = APP_ENV === 'staging';
// DEMO režim: bez Supabase URL beží appka nad localStorage (src/data/demo-store.js).
export const SUPABASE_URL = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';
export const SUPABASE_ANON_KEY = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';
export const DEMO_MODE = !SUPABASE_URL;
export const VAPID_PUBLIC_KEY = (import.meta.env && import.meta.env.VITE_VAPID_PUBLIC_KEY) || '';

// Poppins je písmo značky (Design Manual 2026): ExtraBold verzálky na nadpisy, Regular na text.
// Poppins nemá cyriliku ani vietnamčinu — tie preberá Montserrat (sekundárne písmo manuálu);
// dévanágarí (hi, ne) má Poppins vlastné. Všetko je v builde cez @fontsource.
export const fontFamily = "'Poppins', 'Montserrat', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
// Čísla (izba, referencie, časy) nie sú v monospace — Poppins ExtraBold s tabulkovými číslicami.
export const monoFamily = fontFamily;

// v5: „tieň" bežnej karty je 1px obrys; skutočný tieň má len plávajúci prvok (súhrn práčovne, sheet).
export const shadow = {
  sm: '0 0 0 1px rgba(51,51,51,0.10)',
  md: '0 0 0 1px rgba(51,51,51,0.10), 0 10px 30px rgba(51,51,51,0.08)',
  lg: '0 0 0 1px rgba(51,51,51,0.10), 0 18px 40px rgba(51,51,51,0.10)',
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
