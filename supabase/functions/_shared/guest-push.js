// Push hosťom: nájde predplatné podľa uid / pobytu / budovy, rešpektuje guest_prefs.notifications,
// posiela cez webpush.js a maže zaniknuté predplatné (404/410).
import { env } from './env.js';
import { sendWebPush } from './webpush.js';

export function vapid() { return { subject: env('VAPID_SUBJECT', 'mailto:office@primare.sk'), publicKey: env('VAPID_PUBLIC_KEY'), privateKey: env('VAPID_PRIVATE_KEY') }; }
const inList = (ids) => 'in.(' + ids.map(x => '"' + String(x).replace(/"/g, '') + '"').join(',') + ')';

// target: { uid } | { stayId } | { propertyId } | { all: true }  → [{ uid, lang, endpoint, keys }]
export async function subscriptionsFor(own, target) {
  let uids = null; const langByUid = {};
  if (target.uid) uids = [target.uid];
  else if (target.stayId || target.propertyId || target.all) {
    let links;
    if (target.stayId) links = await own.rest('guest_links?select=uid,stay_id&stay_id=eq.' + target.stayId);
    else {
      const stays = await own.rest('guest_stays?select=id,lang&closed_at=is.null' + (target.propertyId ? '&property_id=eq.' + encodeURIComponent(target.propertyId) : '') + '&limit=5000');
      const ids = stays.map(s => s.id);
      if (!ids.length) return [];
      links = [];
      for (let i = 0; i < ids.length; i += 200) links.push(...await own.rest('guest_links?select=uid,stay_id&stay_id=' + inList(ids.slice(i, i + 200))));
      for (const s of stays) for (const l of links) if (l.stay_id === s.id) langByUid[l.uid] = s.lang;
    }
    uids = [...new Set(links.map(l => l.uid))];
  }
  if (!uids || !uids.length) return [];
  const out = [];
  for (let i = 0; i < uids.length; i += 200) {
    const part = uids.slice(i, i + 200);
    const [subs, prefs] = await Promise.all([
      own.rest('guest_push_subscriptions?select=uid,endpoint,keys&uid=' + inList(part)),
      own.rest('guest_prefs?select=uid,notifications,lang&uid=' + inList(part)),
    ]);
    const off = new Set(prefs.filter(p => p.notifications === false).map(p => p.uid));
    for (const p of prefs) if (p.lang) langByUid[p.uid] = p.lang;
    for (const s of subs) if (!off.has(s.uid)) out.push({ uid: s.uid, endpoint: s.endpoint, keys: s.keys, lang: langByUid[s.uid] || target.lang || 'en' });
  }
  return out;
}
export async function pushTo(own, subs, makePayload, { fetchImpl } = {}) {
  const v = vapid();
  if (!v.publicKey || !v.privateKey) return { sent: 0, gone: 0, skipped: subs.length, reason: 'no_vapid' };
  let sent = 0, gone = 0;
  for (const s of subs) {
    const payload = makePayload(s);
    if (!payload) continue;
    try {
      const r = await sendWebPush({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), { vapid: v, ttl: payload.ttl || 24 * 3600, topic: payload.tag, fetchImpl });
      if (r.ok) sent += 1;
      else if (r.gone) { gone += 1; try { await own.rest('guest_push_subscriptions?uid=eq.' + s.uid + '&endpoint=eq.' + encodeURIComponent(s.endpoint), { method: 'DELETE', prefer: 'return=minimal' }); } catch {} }
    } catch { /* jeden zlý endpoint nezastaví ostatné */ }
  }
  return { sent, gone, skipped: 0 };
}
