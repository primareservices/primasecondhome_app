// Cron (denne): anonymizácia v DB (guest_cleanup) + zmazanie súborov anonymizovaných pobytov v bucketoch.
import { checkWebhookSecret, cors, json } from '../_shared/http.js';
import { own as ownClient } from '../_shared/supa.js';
export async function handle(req, deps = {}) {
  const pre = cors(req); if (pre) return pre;
  if (!checkWebhookSecret(req)) return json({ error: 'forbidden' }, 403);
  const own = deps.own || ownClient();
  const anonymized = await own.rpc('guest_cleanup', { p_days: 30 });
  const since = new Date(Date.now() - 2 * 864e5).toISOString();
  const stays = await own.rest('guest_stays?select=id&anonymized_at=gte.' + since + '&limit=500');
  let removed = 0;
  for (const s of stays) {
    for (const bucket of ['guest-photos', 'guest-docs']) {
      try {
        const objects = await own.list(bucket, s.id + '/');
        const names = objects.map(o => s.id + '/' + o.name).filter(n => !n.endsWith('/'));
        if (names.length) { await own.remove(bucket, names); removed += names.length; }
      } catch { /* ďalší beh to dorobí */ }
    }
  }
  return json({ ok: true, anonymized, filesRemoved: removed });
}
