// Web Push na klientovi: povolenie, predplatné cez service worker (VAPID verejný kľúč z buildu),
// uloženie na server (guest_push_subscriptions) cez adaptér. V DEMO režime sa len prepne nastavenie.
import { DEMO_MODE, VAPID_PUBLIC_KEY } from '../config/app-config.js';
import { removePushSubscription, savePushSubscription } from './adapter.js';

export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}
export function pushPermission() { return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission; }
function keyBytes(b64u) {
  const s = String(b64u || '').replace(/-/g, '+').replace(/_/g, '/'); const pad = s + '='.repeat((4 - s.length % 4) % 4);
  const bin = atob(pad); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
}
// → 'granted' | 'denied' | 'unsupported' | 'demo' | 'no-key'
export async function enablePush() {
  if (!isPushSupported()) return 'unsupported';
  if (DEMO_MODE) return 'demo';
  if (!VAPID_PUBLIC_KEY) return 'no-key';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'denied';
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) });
  const j = sub.toJSON();
  savePushSubscription({ endpoint: j.endpoint, keys: j.keys });
  return 'granted';
}
export async function disablePush() {
  if (!isPushSupported() || DEMO_MODE) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) { removePushSubscription(sub.endpoint); await sub.unsubscribe(); }
  } catch { /* nič */ }
}
