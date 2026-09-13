// Dizajnové tokeny PRIMA SECOND HOME podľa PRIMA Ubytovňa Design Manual 2026 (docs/DESIGN_SYSTEM.md),
// v5 „minimal": biely podklad, obrysy (1px linky) namiesto výplní a tieňov, Carbon text,
// PRIMA červená #EE2A24 len pre hlavnú akciu, výber a brand. Sémantické farby ako text a obrys,
// nie ako plocha. Bez gradientov. Názvy kľúčov (C, BRAND) ostávajú kvôli sesterským appkám.
export const C = {
  bg: '#FFFFFF',        // biele pozadie stránky
  bgWarm: '#FAFAFA',    // neutrálna sivá (prázdne stavy, šrafovanie)
  card: '#FFFFFF',
  cardAlt: '#F4F4F4',   // jediná výplň: jemná sivá (napr. posuvník, pozadie fotky)
  border: 'rgba(51,51,51,0.10)',
  borderStrong: 'rgba(51,51,51,0.18)',
  text: '#333333',      // Carbon
  textMuted: '#6A6A6A',
  textFaint: '#9C9C9C',
  navy: '#333333',      // Carbon — tmavé karty a tlačidlá (názov kľúča je historický)
  radius: 20,
  radiusSm: 14,
  focusRing: '0 0 0 3px rgba(238, 42, 36, 0.22)',
  success: '#1E8E5A', successText: '#1E7A4E', successSoft: '#F1F8F3', successBorder: '#BFE5CF',
  warning: '#E0A63A', warningText: '#8A5A00', warningSoft: '#FDF7E8', warningBorder: '#F0D9A0',   // Sunburst ako obrys
  info:    '#0C66C2', infoText:    '#0C66C2', infoSoft:    '#EEF4FB', infoBorder:    '#B9D0EC',   // Unity
  accent:  '#0C66C2', accentText:  '#0C66C2', accentSoft:  '#EEF4FB', accentBorder:  '#B9D0EC',
};
export const BRAND = {
  red: '#EE2A24',       // PRIMA primárna (teplá)
  redDark: '#B82025',   // PRIMA tmavá — nadpisy, stlačený stav, tmavá strana striešky
  redSoft: '#FDEDEC',   // jemný ružový tón (banner nebezpečenstva, obrys)
  redText: '#B82025',
  redGlow: 'rgba(238, 42, 36, 0.26)',
  carbon: '#333333',
  cream: '#FFFFFF',
  sunburst: '#F9E4B8',
  unity: '#0C66C2',
  // Aliasy pre staršie miesta v kóde — plné farby, žiadne gradienty.
  wine: '#B82025',
  wineDeep: '#B82025',
  wineGradient: '#B82025',
  redGradient: '#EE2A24',
};
