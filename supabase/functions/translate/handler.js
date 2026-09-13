// Preklad pre appku (JWT hosťa overuje platforma): { text, targets } → { src, sk, en, … } cez DeepL.
import { cors, json, readJson } from '../_shared/http.js';
import { translate } from '../_shared/deepl.js';
export async function handle(req, deps = {}) {
  const pre = cors(req); if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await readJson(req);
  const text = String((body && body.text) || '').slice(0, 900);
  const targets = Array.isArray(body && body.targets) ? body.targets.slice(0, 3) : ['sk', 'en'];
  if (!text.trim()) return json({ error: 'empty' }, 400);
  const out = await translate(text, targets, { source: body && body.source, fetchImpl: deps.fetchImpl });
  return json(out);
}
