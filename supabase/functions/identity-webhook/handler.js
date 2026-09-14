// Overenie totožnosti — krok 2: webhook poskytovateľa (?provider=idenfy|veriff) s rozhodnutím.
// Podpis HMAC sa overí nad surovým telom; do guest_identity ide stav + údaje pre domovú knihu; hosť dostane push.
import { json } from '../_shared/http.js';
import { own as ownClient } from '../_shared/supa.js';
import { PROVIDERS } from '../_shared/identity-providers.js';
import { pushText } from '../_shared/push-texts.js';
import { pushTo, subscriptionsFor } from '../_shared/guest-push.js';

export async function handle(req, deps = {}) {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const name = new URL(req.url).searchParams.get('provider') || '';
  const provider = PROVIDERS[name];
  if (!provider) return json({ error: 'unknown_provider' }, 404);
  const raw = await req.text();
  if (!(await provider.verify(raw, req.headers))) return json({ error: 'bad_signature' }, 401);
  let payload = null; try { payload = JSON.parse(raw); } catch { return json({ error: 'bad_json' }, 400); }
  const d = provider.parse(payload);
  if (!d) return json({ ok: true, ignored: 'event' });
  const own = deps.own || ownClient();
  let row = (await own.rest('guest_identity?select=stay_id,status&provider_ref=eq.' + encodeURIComponent(d.ref)))[0];
  if (!row && d.stayId) row = (await own.rest('guest_identity?select=stay_id,status&stay_id=eq.' + encodeURIComponent(d.stayId)))[0];
  if (!row) return json({ error: 'unknown_ref' }, 404);
  if (d.status === 'pending') return json({ ok: true, ignored: 'not_final' });   // expirované / prerušené: hosť skúsi znova
  await own.rest('guest_identity?stay_id=eq.' + row.stay_id, { method: 'PATCH', body: { status: d.status, provider: name, provider_ref: d.ref, data: d.data, checked_at: new Date().toISOString() }, prefer: 'return=minimal' });
  let pushed = 0;
  try {
    const stay = (await own.rest('guest_stays?select=id,lang&id=eq.' + row.stay_id))[0];
    const subs = await subscriptionsFor(own, { stayId: row.stay_id, lang: stay ? stay.lang : 'en' });
    const key = d.status === 'approved' ? 'identityApproved' : d.status === 'declined' ? 'identityDeclined' : 'identityReview';
    const res = await pushTo(own, subs, (s) => ({ title: pushText(s.lang, key), body: '', url: '/#/identity', tag: 'idn-' + row.stay_id }), { fetchImpl: deps.pushFetch });
    pushed = res.sent;
  } catch { /* push je bonus */ }
  return json({ ok: true, status: d.status, pushed });
}
