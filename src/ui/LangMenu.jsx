import { useEffect, useRef, useState } from 'react';
import { BRAND, C } from '../config/theme.js';
import { shadow } from '../config/app-config.js';
import { LANGS, langMeta } from '../config/languages.js';
import { Icon } from './icons.jsx';

// Prepínač jazyka v hlavičke ako v PRIMA RE SERVICE (pilulka SK | EN): pri 12 jazykoch pilulka
// ukazuje aktuálny jazyk a klepnutie otvorí menu; výber prepne jazyk okamžite, bez odchodu na Profil.
// Bez vlajok (vlajka ≠ jazyk). Zatvára sa klepnutím mimo, Escape a výberom.
export function LangMenu({ lang, setLang, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const cur = langMeta(lang);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)} data-testid="lang-menu"
        style={{ height: 44, padding: 3, borderRadius: 22, background: C.cardAlt, border: '1px solid ' + C.border, display: 'inline-flex', alignItems: 'center', gap: 2, color: C.text }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 36, color: C.textMuted }}><Icon name="Languages" size={16}/></span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, height: 36, padding: '0 9px 0 12px', borderRadius: 18, background: C.card, boxShadow: shadow.sm, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: BRAND.red }}>{cur.short}<Icon name="ChevronDown" size={14} color={C.textFaint} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}/></span>
      </button>
      {open && (
        <div role="menu" className="fade-in" style={{ position: 'absolute', top: 52, right: 0, width: 'min(330px, calc(100vw - 40px))', background: C.card, borderRadius: 22, boxShadow: shadow.lg, padding: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, zIndex: 30 }}>
          {LANGS.map(l => { const active = l.code === lang; return (
            <button key={l.code} type="button" role="menuitemradio" aria-checked={active} lang={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 9, minHeight: 46, padding: '0 12px', borderRadius: 15, border: 'none', textAlign: 'left', minWidth: 0, background: active ? C.navy : 'transparent', color: active ? '#fff' : C.text }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: active ? BRAND.red : C.textFaint, width: 22, flexShrink: 0 }}>{l.short}</span>
              <span style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</span>
            </button>); })}
        </div>
      )}
    </div>
  );
}
