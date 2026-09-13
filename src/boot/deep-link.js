// Beží PRED Reactom (načítava sa ako prvý v main.jsx). QR štítok na dverách izby nesie len identitu
// miesta: https://service.primare.sk/?qr=IC23:111/2 — rovnaký formát ako PRIMA RE SERVICE
// (src/boot/deep-link.js, src/qr/payload.js). Akcia sa do kódu nepečie; appka rozhodne
// podľa stavu (prihlásený hosť → predvyplní izbu v hlásení, návštevník → vyberie budovu).
// Parameter sa z adresy hneď maže, aby reload nevrátil hosťa do inej izby, než v ktorej stojí.
import { parseQrPayload } from '../domain/room-codes.js';

export const QR_PARAM = 'qr';
const KEY = 'primaHome:qrPending';
const TTL_MS = 30 * 60 * 1000;   // po pol hodine kód už nič neotvára

function storage() { try { return typeof sessionStorage !== 'undefined' ? sessionStorage : null; } catch { return null; } }
function readPending() {
  const s = storage(); if (!s) return null;
  try {
    const p = JSON.parse(s.getItem(KEY) || 'null');
    if (p && p.raw && Date.now() - (p.at || 0) < TTL_MS) return p;
  } catch {}
  try { s.removeItem(KEY); } catch {}
  return null;
}
function savePending(raw) {
  const s = storage(); if (!s) return;
  try { s.setItem(KEY, JSON.stringify({ raw: String(raw), at: Date.now() })); } catch {}
}

export function captureQrParam(win) {
  const w = win || (typeof window !== 'undefined' ? window : null);
  if (!w || !w.location) return null;
  try {
    const url = new URL(w.location.href);
    let raw = url.searchParams.get(QR_PARAM);
    // Aj tvar #/report?qr=… (odkaz z RE SERVICE presmerovania do hash routra).
    const hm = !raw && /[?&]qr=([^&#\s]+)/i.exec(url.hash || '');
    if (hm) raw = hm[1];
    if (!raw) return readPending();
    savePending(raw);
    url.searchParams.delete(QR_PARAM);
    const hash = (url.hash || '').replace(/([?&])qr=[^&#\s]*&?/i, '$1').replace(/[?&]$/, '');
    const q = url.searchParams.toString();
    try { w.history.replaceState(null, '', url.pathname + (q ? '?' + q : '') + hash); } catch {}
    return { raw, at: Date.now() };
  } catch { return null; }   // nič v adrese nesmie zablokovať štart appky
}

// Nahliadnutie bez spotrebovania (Welcome vyberá budovu) a spotrebovanie (Report predvyplní izbu).
export function peekQrPending() { const p = readPending(); return p ? parseQrPayload(p.raw) : null; }
export function takeQrPending() {
  const p = peekQrPending();
  clearQrPending();
  return p;
}
export function clearQrPending() { const s = storage(); if (s) { try { s.removeItem(KEY); } catch {} } }

captureQrParam();
