import { useEffect, useRef, useState } from 'react';
import { BRAND, C } from '../config/theme.js';
import { useT } from '../i18n/index.js';
import { Icon } from './icons.jsx';

// Podpis prstom (pointer events, 2× rozlíšenie). onChange(dataUrl | null).
export function SignaturePad({ onChange, height = 180 }) {
  const { t } = useT();
  const ref = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [empty, setEmpty] = useState(true);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const r = c.getBoundingClientRect(); const dpr = Math.min(3, window.devicePixelRatio || 1);
    c.width = Math.round(r.width * dpr); c.height = Math.round(height * dpr);
    const ctx = c.getContext('2d'); ctx.scale(dpr, dpr); ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1A1A1A';
  }, [height]);
  const pos = (e) => { const r = ref.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const down = (e) => { e.preventDefault(); ref.current.setPointerCapture(e.pointerId); drawing.current = true; last.current = pos(e); };
  const move = (e) => {
    if (!drawing.current) return; e.preventDefault();
    const p = pos(e), ctx = ref.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last.current = p;
    if (empty) setEmpty(false);
  };
  const up = () => { if (!drawing.current) return; drawing.current = false; onChange && onChange(empty ? null : ref.current.toDataURL('image/png')); };
  const clear = () => { const c = ref.current; const ctx = c.getContext('2d'); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.restore(); setEmpty(true); onChange && onChange(null); };
  return (
    <div>
      <div style={{ position: 'relative', borderRadius: C.radiusSm, background: C.card, boxShadow: 'inset 0 0 0 1.5px ' + C.borderStrong, overflow: 'hidden' }}>
        <canvas ref={ref} style={{ display: 'block', width: '100%', height, touchAction: 'none' }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}/>
        {empty && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textFaint, fontSize: 14, pointerEvents: 'none' }}>{t('rules.signPad')}</div>}
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 34, borderTop: '1px dashed ' + C.borderStrong, pointerEvents: 'none' }}/>
      </div>
      <button type="button" onClick={clear} style={{ marginTop: 8, background: 'none', border: 'none', color: empty ? C.textFaint : BRAND.red, fontWeight: 600, fontSize: 13, padding: '6px 2px', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        <Icon name="X" size={14}/>{t('rules.signClear')}
      </button>
    </div>
  );
}
