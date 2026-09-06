import { BRAND, C } from '../config/theme.js';
import { LANGS } from '../config/languages.js';

// Mriežka jazykov — každý názov vo vlastnom písme, bez vlajok (vlajka ≠ jazyk).
export function LangPicker({ value, onChange, compact }) {
  return (
    <div className="lang-grid" style={compact ? { gridTemplateColumns: 'repeat(3, 1fr)' } : undefined}>
      {LANGS.map(l => {
        const active = l.code === value;
        return (
          <button key={l.code} type="button" onClick={() => onChange(l.code)} lang={l.code} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: compact ? '10px 10px' : '13px 14px', minHeight: compact ? 44 : 54, textAlign: 'left',
            borderRadius: C.radiusSm, border: '1px solid ' + (active ? BRAND.red : C.borderStrong), background: active ? BRAND.redSoft : C.card, color: C.text,
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: active ? BRAND.red : C.textFaint, width: 22, flexShrink: 0 }}>{l.short}</span>
            <span style={{ fontSize: compact ? 14 : 16, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
          </button>
        );
      })}
    </div>
  );
}
