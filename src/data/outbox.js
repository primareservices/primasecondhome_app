// Front zápisov (vzor outbox v PRIMA RE SERVICE): keď je hosť offline alebo zápis zlyhá,
// operácia sa uloží do telefónu a odošle sa sama, keď je spojenie späť. Čistý modul bez
// Reactu a bez dotyku okna pri importe — testuje sa v node. Handlery registruje adaptér
// (demo: označí žiadosť ako odoslanú; Supabase v1.1: skutočný zápis).
const KEY = 'primaHome:outbox:v1';
const handlers = {};
const listeners = new Set();
const mem = {};
let flushing = false;
let started = false;

function store() {
  try { if (typeof localStorage !== 'undefined') return localStorage; } catch {}
  return { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
}
function read() { try { const v = JSON.parse(store().getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } }
function write(list) {
  try { if (list.length) store().setItem(KEY, JSON.stringify(list)); else store().removeItem(KEY); } catch {}
  for (const fn of listeners) { try { fn(); } catch {} }
}

export function isOnline() { return typeof navigator === 'undefined' || navigator.onLine !== false; }
export function registerHandler(op, fn) { handlers[op] = fn; }
export function subscribeOutbox(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function pendingCount() { return read().length; }
export function pendingItems() { return read(); }
export function enqueue(op, payload) {
  const item = { id: 'o_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), op, payload, at: new Date().toISOString(), tries: 0 };
  write([...read(), item]);
  return item;
}
// Odošle po poradí; pri prvej chybe skončí (ďalší pokus príde s online/visibility/intervalom).
export async function flush() {
  if (flushing || !isOnline()) return { sent: 0, left: pendingCount() };
  flushing = true;
  let sent = 0;
  try {
    let list = read();
    for (const item of list.slice()) {
      const h = handlers[item.op];
      if (!h) continue;                       // neznámy handler — nechať v rade (iná verzia appky)
      try {
        await h(item.payload);
        list = list.filter(x => x.id !== item.id); write(list); sent += 1;
      } catch (e) {
        item.tries += 1; item.lastError = String((e && e.message) || e).slice(0, 160); write(list);
        break;
      }
    }
  } finally { flushing = false; }
  return { sent, left: pendingCount() };
}
export function startOutbox() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('online', () => { flush(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') flush(); });
  setInterval(flush, 30 * 1000);
  flush();
}
export function _resetForTests() { write([]); for (const k of Object.keys(handlers)) delete handlers[k]; flushing = false; }
