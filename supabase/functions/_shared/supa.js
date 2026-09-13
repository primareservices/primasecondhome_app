// Tenký REST klient nad Supabase pre edge funkcie (service role — nikdy v klientovi).
import { env } from './env.js';
export class SupaHttpError extends Error { constructor(status, body) { super((body && (body.message || body.msg)) || 'http_' + status); this.status = status; this.body = body; } }
export function client(url, key, fetchImpl) {
  const f = fetchImpl || ((...a) => fetch(...a));
  const base = String(url || '').replace(/\/$/, '');
  const headers = (extra) => ({ apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...extra });
  async function call(path, { method = 'GET', body, prefer, raw } = {}) {
    const r = await f(base + path, { method, headers: headers(prefer ? { Prefer: prefer } : {}), body: body === undefined ? undefined : JSON.stringify(body) });
    if (raw) return r;
    const text = await r.text();
    let j = null; try { j = text ? JSON.parse(text) : null; } catch { j = { message: text.slice(0, 300) }; }
    if (!r.ok) throw new SupaHttpError(r.status, j);
    return j;
  }
  return {
    base, key,
    rest: (path, opts) => call('/rest/v1/' + path, opts),
    rpc: (name, args) => call('/rest/v1/rpc/' + name, { method: 'POST', body: args || {} }),
    async upload(bucket, path, bytes, contentType) {
      const r = await f(base + '/storage/v1/object/' + bucket + '/' + path, { method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': contentType, 'x-upsert': 'true' }, body: bytes });
      if (!r.ok) throw new SupaHttpError(r.status, { message: await r.text() });
      return path;
    },
    async download(bucket, path) {
      const r = await f(base + '/storage/v1/object/' + bucket + '/' + path, { headers: { apikey: key, Authorization: 'Bearer ' + key } });
      if (!r.ok) throw new SupaHttpError(r.status, { message: await r.text() });
      return new Uint8Array(await r.arrayBuffer());
    },
    async remove(bucket, paths) {
      const r = await f(base + '/storage/v1/object/' + bucket, { method: 'DELETE', headers: headers(), body: JSON.stringify({ prefixes: paths }) });
      if (!r.ok) throw new SupaHttpError(r.status, { message: await r.text() });
      return true;
    },
    // Podpísaný odkaz (napr. fotky hosťa pre personál RE SERVICE) — plná adresa.
    async sign(bucket, path, expiresIn = 3600) {
      const j = await call('/storage/v1/object/sign/' + bucket + '/' + path, { method: 'POST', body: { expiresIn } });
      return j && j.signedURL ? base + '/storage/v1' + j.signedURL : null;
    },
    async list(bucket, prefix) {
      const j = await call('/storage/v1/object/list/' + bucket, { method: 'POST', body: { prefix, limit: 1000 } });
      return Array.isArray(j) ? j : [];
    },
  };
}
export const own = () => client(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
export const reService = () => client(env('RE_SERVICE_URL'), env('RE_SERVICE_SERVICE_KEY'));
