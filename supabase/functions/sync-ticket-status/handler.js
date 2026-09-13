// Cron (každých 5 min): stavy ticketov RE SERVICE → stavy žiadostí hostí + push hosťovi pri zmene.
import { checkWebhookSecret, cors, json } from '../_shared/http.js';
import { env } from '../_shared/env.js';
import { own as ownClient, reService } from '../_shared/supa.js';
import { translate } from '../_shared/deepl.js';
import { statusFromTicket } from '../_shared/ticket-bridge.js';
import { pushText, statusText } from '../_shared/push-texts.js';
import { pushTo, subscriptionsFor } from '../_shared/guest-push.js';

const OPEN = ['reported', 'assigned', 'inProgress', 'longer', 'major', 'deferred'];
const inList = (ids) => 'in.(' + ids.map(x => '"' + String(x).replace(/"/g, '') + '"').join(',') + ')';

export async function handle(req, deps = {}) {
  const pre = cors(req); if (pre) return pre;
  if (!checkWebhookSecret(req)) return json({ error: 'forbidden' }, 403);
  if (!env('RE_SERVICE_URL') || !env('RE_SERVICE_SERVICE_KEY')) return json({ error: 'missing_re_service_secrets' }, 503);
  const own = deps.own || ownClient();
  const re = deps.re || reService();
  const reqs = await own.rest('guest_requests?select=id,stay_id,ref,status,timeline,external_ref,lang&external_ref=not.is.null&status=' + inList(OPEN) + '&limit=200');
  if (!reqs.length) return json({ ok: true, checked: 0, changed: 0 });
  const tickets = await re.rest('tickets?select=id,status,updated_at,data&id=' + inList(reqs.map(r => r.external_ref)));
  const byId = Object.fromEntries(tickets.map(t => [t.id, t]));
  let changed = 0, pushed = 0;
  for (const r of reqs) {
    const t = byId[r.external_ref];
    if (!t) continue;
    const status = statusFromTicket(t.status);
    if (status === r.status) continue;
    const lang = r.lang || 'en';
    const resolution = t.data && typeof t.data.resolution === 'string' ? t.data.resolution.trim() : '';
    let note = null;
    if (resolution) {
      note = { sk: resolution };
      const tr = await translate(resolution, ['en', lang], { source: 'sk', fetchImpl: deps.fetchImpl });
      if (tr.en) note.en = tr.en; if (tr[lang]) note[lang] = tr[lang];
    }
    const timeline = Array.isArray(r.timeline) ? r.timeline.slice() : [];
    timeline.push({ at: new Date().toISOString(), status, ...(note ? { note } : {}) });
    await own.rest('guest_requests?id=eq.' + r.id, { method: 'PATCH', body: { status, timeline }, prefer: 'return=minimal' });
    changed += 1;
    try {
      const subs = await subscriptionsFor(own, { stayId: r.stay_id, lang });
      const res = await pushTo(own, subs, (s) => ({ title: status === 'resolved' ? pushText(s.lang, 'resolved', { ref: r.ref }) : pushText(s.lang, 'statusUpdate', { ref: r.ref, status: statusText(s.lang, status) }), body: note ? (note[s.lang] || note.en || note.sk) : '', url: '/#/requests/' + r.id, tag: 'req-' + r.id }), { fetchImpl: deps.pushFetch });
      pushed += res.sent;
    } catch { /* push je bonus */ }
  }
  return json({ ok: true, checked: reqs.length, changed, pushed });
}
