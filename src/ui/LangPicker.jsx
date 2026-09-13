import { BRAND, C } from '../config/theme.js';
import { LANGS } from '../config/languages.js';

// Karta jazyka: názov vo vlastnom písme + kód; aktívna je atramentová s červeným kódom.
// Bez vlajok (vlajka ≠ jazyk).
export function LangCard({ l, active, onClick, compact }) {
  return (
    <button type="button" onClick={onClick} lang={l.code} aria-pressed={active} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, padding: compact ? '11px 14px' : '14px 16px', minHeight: compact ? 56 : 64, borderRadius: 18, border: 'none', textAlign: 'left', minWidth: 0,
      background: active ? C.navy : C.card, color: active ? '#fff' : C.text, boxShadow: active ? 'none' : 'inset 0 0 0 1px ' + C.border,
    }}>
      <b style={{ fontSize: compact ? 15 : 17, fontWeight: 800, letterSpacing: '-0.02em', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</b>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: active ? BRAND.red : C.textFaint }}>{l.short}</span>
    </button>
  );
}
export function LangPicker({ value, onChange, compact }) {
  return (
    <div className="lang-grid">
      {LANGS.map(l => <LangCard key={l.code} l={l} active={l.code === value} compact={compact} onClick={() => onChange(l.code)}/>)}
    </div>
  );
}
