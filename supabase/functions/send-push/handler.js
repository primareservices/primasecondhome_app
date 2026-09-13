// Push hosťom. Dva vstupy: (a) webhook z DB pri INSERT do guest_announcements → všetci hostia budovy
// (alebo siete) vo svojom jazyku; (b) interné volanie { target, title, body, url, tag } so secretom.
import { checkWebhookSecret, cors, json, readJson } from '../_shared/http.js';
import { own as ownClient } from '../_shared/supa.js';
import { pushText } from '../_shared/push-texts.js';
import { translate } from '../_shared/deepl.js';
import { pushTo, subscriptionsFor } from '../_shared/guest-push.js';

export async function handle(req, deps = {}) {
  const pre = cors(req); if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!checkWebhookSecret(req)) return json({ error: 'forbidden' }, 403);
  const own = deps.own || ownClient();
  const body = await readJson(req);
  if (!body) return json({ error: 'bad_json' }, 400);
  const pushAnnouncement = async (a) => {
    const subs = await subscriptionsFor(own, a.property_id ? { propertyId: a.property_id } : { all: true });
    const res = await pushTo(own, subs, (s) => {
      const tx = a.texts[s.lang] || a.texts.en || a.texts.sk || Object.values(a.texts)[0];
      if (!tx) return null;
      return { title: (a.severity === 'urgent' ? '❗ ' : '') + (tx.title || pushText(s.lang, 'announcement')), body: (tx.body || '').slice(0, 180), url: '/#/announcements', tag: 'ann-' + a.id, ttl: 12 * 3600 };
    }, { fetchImpl: deps.pushFetch });
    try { await own.rest('guest_announcements?id=eq.' + a.id, { method: 'PATCH', body: { pushed_at: new Date().toISOString() }, prefer: 'return=minimal' }); } catch { /* len značka */ }
    return { recipients: subs.length, ...res };
  };
  if (body.dueAnnouncements) {   // cron: naplánované oznamy, ktorých čas práve nastal
    const due = await own.rest('guest_announcements?select=*&pushed_at=is.null&valid_from=lte.' + encodeURIComponent(new Date().toISOString()) + '&order=valid_from.asc&limit=50');
    let sent = 0;
    for (const a of due) { const r = await pushAnnouncement(a); sent += r.sent; }
    return json({ ok: true, due: due.length, sent });
  }
  if (body.record && body.record.texts) {   // webhook: nový oznam
    const a = body.record;
    if (a.valid_from && new Date(a.valid_from).getTime() > Date.now() + 60 * 1000) return json({ skipped: 'scheduled' });   // pošle cron
    return json({ ok: true, ...(await pushAnnouncement(a)) });
  }
  if (body.record && body.record.sender && body.record.stay_id) {   // správa (webhook guest_messages INSERT)
    const m = body.record;
    const stay = (await own.rest('guest_stays?select=id,lang,property_id&id=eq.' + m.stay_id))[0];
    if (!stay) return json({ error: 'stay_not_found' }, 404);
    if (m.sender === 'reception') {
      const lang = stay.lang || 'en';
      const tr = await translate(m.text, ['en', lang], { source: 'sk', fetchImpl: deps.fetchImpl });
      if (Object.keys(tr).length) await own.rest('guest_messages?id=eq.' + m.id, { method: 'PATCH', body: { tr }, prefer: 'return=minimal' });
      const subs = await subscriptionsFor(own, { stayId: stay.id, lang });
      const res = await pushTo(own, subs, (s) => ({ title: pushText(s.lang, 'message'), body: String(tr[s.lang] || tr.en || m.text).slice(0, 180), url: '/#/messages', tag: 'msg-' + stay.id }), { fetchImpl: deps.pushFetch });
      return json({ ok: true, translated: !!tr[lang], recipients: subs.length, ...res });
    }
    const tr = await translate(m.text, ['sk', 'en'], { source: m.lang, fetchImpl: deps.fetchImpl });   // hosť → preklad pre recepciu
    if (Object.keys(tr).length) await own.rest('guest_messages?id=eq.' + m.id, { method: 'PATCH', body: { tr }, prefer: 'return=minimal' });
    return json({ ok: true, translated: !!tr.sk });
  }
  if (body.target && body.title) {
    const subs = await subscriptionsFor(own, body.target);
    const res = await pushTo(own, subs, () => ({ title: body.title, body: body.body || '', url: body.url || '/', tag: body.tag }), { fetchImpl: deps.pushFetch });
    return json({ ok: true, recipients: subs.length, ...res });
  }
  return json({ error: 'nothing_to_send' }, 400);
}
