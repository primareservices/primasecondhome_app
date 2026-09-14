// ── Lístok pri check-ine (tlač): kód, QR do appky, inštrukcia v 5 jazykoch ─────────────
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { SLIP_TEXT, slipModel } from './model.js';

export function useQr(text) {
  const [url, setUrl] = useState('');
  useEffect(() => { let alive = true; QRCode.toDataURL(text, { margin: 1, width: 220, errorCorrectionLevel: 'M' }).then(u => { if (alive) setUrl(u); }).catch(() => setUrl('')); return () => { alive = false; }; }, [text]);
  return url;
}
// A6 na výšku (105 × 148 mm); `compact` = viac lístkov na A4 pri hromadnej tlači
export function Slip({ stay, code, property, compact = false }) {
  const m = slipModel({ stay, code, property });
  const qr = useQr(m.url);
  return (
    <div className="hostia-slip" style={{ width: compact ? '96mm' : '105mm', minHeight: compact ? '120mm' : '148mm', padding: '8mm', boxSizing: 'border-box', background: '#fff', color: '#333', fontFamily: 'Inter, system-ui, sans-serif', border: '1px solid #ddd', borderRadius: 8, breakInside: 'avoid', pageBreakInside: 'avoid', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/prima-logo.png" alt="PRIMA" style={{ height: 22 }}/>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#666' }}>{m.property}{m.room ? ' · ' + m.room : ''}</div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800 }}>{SLIP_TEXT[m.langs[0]].title}{m.name ? ' · ' + m.name : ''}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {qr ? <img src={qr} alt="QR" style={{ width: 88, height: 88 }}/> : <div style={{ width: 88, height: 88, background: '#f2f2f2' }}/>}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#666', letterSpacing: '.08em', textTransform: 'uppercase' }}>Kód · Code</div>
          <div style={{ fontSize: compact ? 21 : 26, fontWeight: 800, letterSpacing: '.05em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{m.code}</div>
          <div style={{ fontSize: 10, color: '#666', wordBreak: 'break-all' }}>{m.url.replace(/^https:\/\//, '')}</div>
        </div>
      </div>
      <div style={{ fontSize: 10.5, lineHeight: 1.35, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {m.langs.map(l => <div key={l}><b style={{ color: '#BD2435' }}>{l.toUpperCase()}</b> {SLIP_TEXT[l].line} <span style={{ color: '#666' }}>{SLIP_TEXT[l].valid}</span></div>)}
      </div>
    </div>
  );
}
// Tlačový režim: ostatný obsah stránky sa skryje, lístky sa uložia na A4 (2 × 2 v kompaktnom tvare).
export function SlipPrintStyles() {
  return <style>{`
    @media print {
      body * { visibility: hidden !important; }
      .hostia-print, .hostia-print * { visibility: visible !important; }
      .hostia-print { position: absolute; left: 0; top: 0; width: 100%; display: flex; flex-wrap: wrap; gap: 6mm; padding: 6mm; }
      /* modal TOOLS (.zam-ov je fixed + overflow) by lístky orezal na jednu stranu */
      .zam-ov { position: static !important; overflow: visible !important; padding: 0 !important; background: none !important; backdrop-filter: none !important; }
      .zam-modal { max-width: none !important; box-shadow: none !important; overflow: visible !important; }
      @page { size: A4; margin: 8mm; }
    }
  `}</style>;
}
