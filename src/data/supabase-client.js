// Tenký klient nad Supabase bez SDK (rovnaký prístup ako supaFetch v PRIMA RE SERVICE): anonymné
// prihlásenie hosťa, obnova tokenu, PostgREST, RPC, Storage a edge funkcie. Kľúč je verejný
// (publishable) — všetko chráni RLS. Sieťové chyby majú name 'NetworkError', aby ich outbox
// skúsil znova; chyby 4xx sú trvalé (permanent) a z frontu vypadnú.
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/app-config.js';

const KEY = 'primaHome:auth:v1';
let baseUrl = SUPABASE_URL, anonKey = SUPABASE_ANON_KEY;
const TIMEOUT_MS = 15000;
let session = null;
let inflight = null;

export class SupaError extends Error {
  constructor(status, body) {
    const b = body && typeof body === 'object' ? body : {};
    super(b.message || b.msg || b.error_description || b.error || ('http_' + status));
    this.name = 'SupaError'; this.status = status; this.code = b.code || null; this.details = b.details || null;
    this.permanent = status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429;
  }
}
function networkError(e) { const err = new Error('network: ' + ((e && e.message) || e)); err.name = 'NetworkError'; err.permanent = false; return err; }

function loadSession() { if (session) return session; try { session = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { session = null; } return session; }
function saveSession(s) { session = s; try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch {} }
export function getUid() { const s = loadSession(); return s && s.user ? s.user.id : null; }
export function hasSession() { return !!loadSession(); }
export function clearSession() { saveSession(null); }

async function http(url, { method = 'GET', headers = {}, body, raw = false } = {}) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
  let r;
  try { r = await fetch(url, { method, headers, body, signal: ctrl ? ctrl.signal : undefined }); }
  catch (e) { throw networkError(e); }
  finally { if (timer) clearTimeout(timer); }
  if (raw) return r;
  const text = await r.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = { message: text.slice(0, 200) }; }
  if (!r.ok) throw new SupaError(r.status, json);
  return json;
}
const authHeaders = (extra) => ({ apikey: anonKey, 'Content-Type': 'application/json', ...extra });

// ── auth ──
function normalizeSession(j) {
  if (!j || !j.access_token) throw new SupaError(500, { message: 'no_session' });
  return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: { id: j.user && j.user.id } };
}
async function signInAnonymously() {
  // GoTrue: POST /auth/v1/signup bez e-mailu a hesla = anonymný používateľ (treba zapnúť „Allow anonymous sign-ins“).
  const j = await http(baseUrl + '/auth/v1/signup', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ data: { app: 'second-home' } }) });
  const s = normalizeSession(j); saveSession(s); return s;
}
async function refreshSession(refresh_token) {
  const j = await http(baseUrl + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ refresh_token }) });
  const s = normalizeSession(j); saveSession(s); return s;
}
// Platná session (obnoví alebo založí anonymnú). Súbežné volania zdieľajú jeden sľub.
export function ensureSession() {
  if (inflight) return inflight;
  inflight = (async () => {
    const s = loadSession();
    if (s && s.expires_at * 1000 - Date.now() > 60 * 1000) return s;
    if (s && s.refresh_token) {
      try { return await refreshSession(s.refresh_token); }
      catch (e) { if (e.name === 'NetworkError') throw e; saveSession(null); }
    }
    return signInAnonymously();
  })().finally(() => { inflight = null; });
  return inflight;
}

// ── PostgREST / RPC / funkcie / storage ──
async function withAuth(fn) {
  const s = await ensureSession();
  try { return await fn(s.access_token); }
  catch (e) {
    if (e instanceof SupaError && e.status === 401 && s.refresh_token) {
      const s2 = await refreshSession(s.refresh_token);
      return fn(s2.access_token);
    }
    throw e;
  }
}
export function rest(path, { method = 'GET', body, prefer, headers } = {}) {
  return withAuth((token) => http(baseUrl + '/rest/v1/' + path, {
    method, body: body === undefined ? undefined : JSON.stringify(body),
    headers: authHeaders({ Authorization: 'Bearer ' + token, ...(prefer ? { Prefer: prefer } : {}), ...(headers || {}) }),
  }));
}
export function rpc(name, args) { return rest('rpc/' + name, { method: 'POST', body: args || {} }); }
export function invoke(name, body) {
  return withAuth((token) => http(baseUrl + '/functions/v1/' + name, { method: 'POST', body: JSON.stringify(body || {}), headers: authHeaders({ Authorization: 'Bearer ' + token }) }));
}
export async function uploadDataUrl(bucket, path, dataUrl) {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl || '');
  if (!m) throw new SupaError(400, { message: 'bad_data_url' });
  const bin = atob(m[2]); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return withAuth((token) => http(baseUrl + '/storage/v1/object/' + bucket + '/' + path, {
    method: 'POST', body: bytes, headers: { apikey: anonKey, Authorization: 'Bearer ' + token, 'Content-Type': m[1], 'x-upsert': 'true' },
  }));
}
export async function signedUrl(bucket, path, expiresIn = 3600) {
  const j = await withAuth((token) => http(baseUrl + '/storage/v1/object/sign/' + bucket + '/' + path, { method: 'POST', body: JSON.stringify({ expiresIn }), headers: authHeaders({ Authorization: 'Bearer ' + token }) }));
  return baseUrl + '/storage/v1' + j.signedURL;
}
// Pre testy: vlastný fetch a vymazanie stavu.
export function _resetClientForTests() { session = null; inflight = null; }
export function _configureForTests({ url, key }) { baseUrl = url; anonKey = key; session = null; inflight = null; }
export function isConfigured() { return !!baseUrl; }
