// Dizajnové tokeny PRIMA SECOND HOME podľa PRIMA Ubytovňa Design Manual 2026 (docs/DESIGN_SYSTEM.md).
// Paleta: PRIMA červená #EE2A24 a #B82025, Carbon #333333, Unity #0C66C2, Sunburst #F9E4B8,
// White Fence #F8F2E4. Bez gradientov (manuál ich pri logu zakazuje) — hierarchiu robia
// plné plochy, biele karty a mäkký tieň. Názvy kľúčov (C, BRAND) ostávajú kvôli sesterským appkám.
export const C = {
  bg: '#F8F2E4',        // White Fence — pozadie stránky
  bgWarm: '#FBF7EE',    // svetlejší krém (prázdne stavy)
  card: '#FFFFFF',
  cardAlt: '#F3EDE0',   // krémový box ikony
  border: 'rgba(51,51,51,0.08)',
  borderStrong: 'rgba(51,51,51,0.14)',
  text: '#333333',      // Carbon
  textMuted: '#6A6A6A',
  textFaint: '#9C9C9C',
  navy: '#333333',      // Carbon — tmavé karty a tlačidlá (názov kľúča je historický)
  radius: 24,
  radiusSm: 16,
  focusRing: '0 0 0 3px rgba(238, 42, 36, 0.22)',
  success: '#1E8E5A', successText: '#1E7A4E', successSoft: '#E3F4EA', successBorder: '#BFE5CF',
  warning: '#F2B94A', warningText: '#8A5A00', warningSoft: '#F9E4B8', warningBorder: '#F2D48C',   // Sunburst
  info:    '#0C66C2', infoText:    '#0C66C2', infoSoft:    '#DCE8F6', infoBorder:    '#B9D0EC',   // Unity
  accent:  '#0C66C2', accentText:  '#0C66C2', accentSoft:  '#DCE8F6', accentBorder:  '#B9D0EC',
};
export const BRAND = {
  red: '#EE2A24',       // PRIMA primárna (teplá)
  redDark: '#B82025',   // PRIMA tmavá — nadpisy, stlačený stav, tmavá strana striešky
  redSoft: '#FBE4E2',   // highlighter — svetloružový podklad s červeným textom
  redText: '#B82025',
  redGlow: 'rgba(238, 42, 36, 0.26)',
  carbon: '#333333',
  cream: '#F8F2E4',
  sunburst: '#F9E4B8',
  unity: '#0C66C2',
  // Aliasy pre staršie miesta v kóde — plné farby, žiadne gradienty.
  wine: '#B82025',
  wineDeep: '#B82025',
  wineGradient: '#B82025',
  redGradient: '#EE2A24',
};
