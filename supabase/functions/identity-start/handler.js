// Overenie totožnosti — krok 1: hosť (JWT overila platforma, verify_jwt = true) požiada o session
// u poskytovateľa; vrátime URL na presmerovanie. Bez nastaveného poskytovateľa → { status: 'unavailable' }
// (appka povie „doklad ukážete na recepcii“). Stav sa vedie v guest_identity (pending → webhook doplní výsledok).
import { cors, json, readJson } from '../_shared/http.js';
import { env } from '../_shared/env.js';
import { own as ownClient } from '../_shared/supa.js';
import { activeProvider } from '../_shared/identity-providers.js';

export function uidFromJwt(req) {
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const part = tok.split('.')[1]; if (!part) return null;
  try { const p = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='))); return p.sub || null; } catch { return null; }
}
export async function handle(req, deps = {}) {
  const pre = cors(req); if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const uid = deps.uid || uidFromJwt(req);
  if (!uid) return json({ error: 'unauthorized' }, 401);
  const own = deps.own || ownClient();
  const body = (await readJson(req)) || {};
  const link = (await own.rest('guest_links?select=stay_id&uid=eq.' + encodeURIComponent(uid) + '&order=created_at.desc&limit=1'))[0];
  if (!link) return json({ error: 'no_stay' }, 404);
  const stay = (await own.rest('guest_stays?select=id,display_name,lang,closed_at&id=eq.' + link.stay_id))[0];
  if (!stay || stay.closed_at) return json({ error: 'no_stay' }, 404);
  const existing = (await own.rest('guest_identity?select=status,provider,checked_at&stay_id=eq.' + stay.id))[0];
  if (existing && existing.status === 'approved') return json({ status: 'approved', provider: existing.provider, checkedAt: existing.checked_at });
  const provider = deps.provider || activeProvider();
  if (!provider) return json({ status: 'unavailable' });
  const lang = String(body.lang || stay.lang || 'en').slice(0, 5);
  const appUrl = env('APP_URL', 'https://home.primare.sk').replace(/\/$/, '');
  const returnUrl = appUrl + '/#/identity?done=1';
  const webhookUrl = env('SUPABASE_URL') ? env('SUPABASE_URL').replace(/\/$/, '') + '/functions/v1/identity-webhook?provider=' + provider.name : '';
  const s = await provider.createSession({ stay, lang, returnUrl, webhookUrl, fetchImpl: deps.fetchImpl });
  await own.rest('guest_identity?on_conflict=stay_id', { method: 'POST', body: { stay_id: stay.id, status: 'pending', provider: provider.name, provider_ref: s.ref, data: {}, checked_at: null }, prefer: 'resolution=merge-duplicates,return=minimal' });
  return json({ status: 'pending', provider: provider.name, url: s.url, ref: s.ref });
}
