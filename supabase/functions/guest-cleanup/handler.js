// Cron (denne): anonymizácia v DB (guest_cleanup) + zmazanie súborov anonymizovaných pobytov v bucketoch.
import { checkWebhookSecret, cors, json } from '../_shared/http.js';
import { own as ownClient } from '../_shared/supa.js';
// Storage list nie je rekurzívny (fotky sú v <stay>/<žiadosť>/n.jpg): priečinky majú id = null.
export async function listRecursive(own, bucket, prefix, depth = 0) {
  const out = [];
  if (depth > 4) return out;
  for (const o of await own.list(bucket, prefix)) {
    if (o.id === null) out.push(...await listRecursive(own, bucket, prefix + o.name + '/', depth + 1));
    else out.push(prefix + o.name);
  }
  return out;
}
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
        const names = await listRecursive(own, bucket, s.id + '/');
        if (names.length) { await own.remove(bucket, names); removed += names.length; }
      } catch { /* ďalší beh to dorobí */ }
    }
  }
  return json({ ok: true, anonymized, filesRemoved: removed });
}
