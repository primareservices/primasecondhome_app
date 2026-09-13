// Push hosťom. Dva vstupy: (a) webhook z DB pri INSERT do guest_announcements → všetci hostia budovy
// (alebo siete) vo svojom jazyku; (b) interné volanie { target, title, body, url, tag } so secretom.
import { checkWebhookSecret, cors, json, readJson } from '../_shared/http.js';
import { own as ownClient } from '../_shared/supa.js';
import { pushText } from '../_shared/push-texts.js';
import { pushTo, subscriptionsFor } from '../_shared/guest-push.js';

export async function handle(req, deps = {}) {
  const pre = cors(req); if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!checkWebhookSecret(req)) return json({ error: 'forbidden' }, 403);
  const own = deps.own || ownClient();
  const body = await readJson(req);
  if (!body) return json({ error: 'bad_json' }, 400);
  if (body.record && body.record.texts) {   // oznam
    const a = body.record;
    if (a.valid_from && new Date(a.valid_from).getTime() > Date.now() + 60 * 1000) return json({ skipped: 'not_yet_valid' });
    const subs = await subscriptionsFor(own, a.property_id ? { propertyId: a.property_id } : { all: true });
    const res = await pushTo(own, subs, (s) => {
      const tx = a.texts[s.lang] || a.texts.en || a.texts.sk || Object.values(a.texts)[0];
      if (!tx) return null;
      return { title: (a.severity === 'urgent' ? '❗ ' : '') + (tx.title || pushText(s.lang, 'announcement')), body: (tx.body || '').slice(0, 180), url: '/#/announcements', tag: 'ann-' + a.id, ttl: 12 * 3600 };
    }, { fetchImpl: deps.pushFetch });
    return json({ ok: true, recipients: subs.length, ...res });
  }
  if (body.target && body.title) {
    const subs = await subscriptionsFor(own, body.target);
    const res = await pushTo(own, subs, () => ({ title: body.title, body: body.body || '', url: body.url || '/', tag: body.tag }), { fetchImpl: deps.pushFetch });
    return json({ ok: true, recipients: subs.length, ...res });
  }
  return json({ error: 'nothing_to_send' }, 400);
}
