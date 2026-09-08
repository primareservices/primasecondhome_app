// Dizajnové tokeny PRIMA SECOND HOME — smer A „Teplý a sebavedomý" (docs/NAVRH_V2.md, plátno v3).
// Teplé pozadie, atrament, PRIMA červená ako jediný silný akcent, tmavovínová karta pobytu,
// tyrkysová a jantárová len pre stavy. Bez 1px rámikov — hierarchiu robia tóny a mäkké tiene.
// Názvy kľúčov (C, BRAND) ostávajú kvôli kompatibilite so sesterskými appkami; hodnoty sú nové.
export const C = {
  bg: '#F6F2EE',
  bgWarm: '#FCFAF8',
  card: '#FFFFFF',
  cardAlt: '#F1EAE3',
  border: 'rgba(23,22,26,0.06)',
  borderStrong: 'rgba(23,22,26,0.10)',
  text: '#17161A',
  textMuted: '#5C5860',
  textFaint: '#9A959C',
  navy: '#17161A',
  radius: 22,
  radiusSm: 16,
  focusRing: '0 0 0 3px rgba(189, 36, 53, 0.18)',
  success: '#1B8A5A', successText: '#1B8A5A', successSoft: '#E4F5EC', successBorder: '#BFE8D2',
  warning: '#D98A1E', warningText: '#B8721A', warningSoft: '#FDF1DC', warningBorder: '#F6DFB5',
  info:    '#0E7C7B', infoText:    '#0E7C7B', infoSoft:    '#E3F3F1', infoBorder:    '#BFE3DF',
  accent:  '#0E7C7B', accentText:  '#0E7C7B', accentSoft:  '#E3F3F1', accentBorder:  '#BFE3DF',
};
export const BRAND = {
  red: '#BD2435',
  redDark: '#8E1A28',
  redSoft: '#FBEDEF',
  redText: '#BD2435',
  redGlow: 'rgba(189, 36, 53, 0.32)',
  wine: '#4A0F1B',
  wineDeep: '#2B0B12',
  wineGradient: 'radial-gradient(120% 90% at 100% 0%, rgba(189,36,53,0.6) 0%, rgba(189,36,53,0) 55%), linear-gradient(135deg, #5B1322 0%, #2B0B12 100%)',
  redGradient: 'radial-gradient(120% 80% at 100% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%), linear-gradient(160deg, #C9273A 0%, #8E1A28 100%)',
};
