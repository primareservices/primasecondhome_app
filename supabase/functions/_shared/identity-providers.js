// Poskytovatelia overenia totožnosti (eKYC): server založí session (API kľúče len tu), hosť prejde
// SDK poskytovateľa v prehliadači (presmerovanie), výsledok príde webhookom podpísaným HMAC.
// Ukladáme len údaje pre domovú knihu (meno, dátum narodenia, štátna príslušnosť, doklad) — nikdy
// fotky ani biometriu (docs/CHECKIN_PODPIS_OVERENIE.md §2). Výber: secret IDENTITY_PROVIDER = idenfy | veriff.
import { env } from './env.js';

const enc = new TextEncoder();
export async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(text));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export function safeEqual(a, b) {
  a = String(a || '').toLowerCase(); b = String(b || '').toLowerCase();
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const pick = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));
const b64 = (s) => (typeof btoa === 'function' ? btoa(s) : Buffer.from(s).toString('base64'));
// jazyk appky → locale poskytovateľa (mimo zoznamu → angličtina; doplniť podľa aktuálnej ponuky poskytovateľa)
const IDENFY_LOCALES = { sk: 'sk', en: 'en', uk: 'uk', ru: 'ru', ro: 'ro', hu: 'hu', pl: 'pl', cs: 'cs', de: 'de' };

export const PROVIDERS = {
  // iDenfy — https://documentation.idenfy.com (token → redirect; callback podpísaný hlavičkou Idenfy-Signature)
  idenfy: {
    name: 'idenfy',
    configured: () => !!(env('IDENFY_API_KEY') && env('IDENFY_API_SECRET')),
    async createSession({ stay, lang, returnUrl, webhookUrl, fetchImpl }) {
      const f = fetchImpl || ((...a) => fetch(...a));
      const base = env('IDENFY_BASE_URL', 'https://ivs.idenfy.com').replace(/\/$/, '');
      const body = { clientId: stay.id, locale: IDENFY_LOCALES[lang] || 'en', successUrl: returnUrl + '&r=ok', errorUrl: returnUrl + '&r=err', unverifiedUrl: returnUrl + '&r=unverified',
        expiryTime: 3600, sessionLength: 1800, ...(webhookUrl ? { callbackUrl: webhookUrl } : {}) };
      const r = await f(base + '/api/v2/token', { method: 'POST', headers: { Authorization: 'Basic ' + b64(env('IDENFY_API_KEY') + ':' + env('IDENFY_API_SECRET')), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j || !j.authToken) throw new Error('idenfy_token_' + r.status);
      return { ref: j.scanRef, url: base + '/api/v2/redirect?authToken=' + encodeURIComponent(j.authToken) };
    },
    async verify(rawBody, headers) {
      const key = env('IDENFY_WEBHOOK_KEY'); if (!key) return false;
      return safeEqual(await hmacHex(key, rawBody), headers.get('idenfy-signature') || '');
    },
    parse(p) {
      if (!p || !p.scanRef || !p.status) return null;
      const overall = String(p.status.overall || '').toUpperCase();
      if (!p.final && !['APPROVED', 'DENIED', 'SUSPECTED', 'EXPIRED'].includes(overall)) return null;   // priebežné udalosti
      const status = overall === 'APPROVED' ? 'approved' : overall === 'DENIED' ? 'declined' : overall === 'SUSPECTED' || overall === 'REVIEWING' ? 'review' : 'pending';
      const d = p.data || {};
      return { ref: p.scanRef, stayId: p.clientId || null, status,
        data: pick({ firstName: d.docFirstName, lastName: d.docLastName, dob: d.docDob, nationality: d.docNationality, docType: d.docType, docNumber: d.docNumber, docExpiry: d.docExpiry, docCountry: d.docIssuingCountry }) };
    },
  },
  // Veriff — https://devs.veriff.com (session → url; decision webhook s X-AUTH-CLIENT + X-HMAC-SIGNATURE)
  veriff: {
    name: 'veriff',
    configured: () => !!(env('VERIFF_API_KEY') && env('VERIFF_SHARED_SECRET')),
    async createSession({ stay, lang, returnUrl, fetchImpl }) {
      const f = fetchImpl || ((...a) => fetch(...a));
      const base = env('VERIFF_BASE_URL', 'https://stationapi.veriff.com').replace(/\/$/, '');
      const firstName = String(stay.display_name || '').split(' ')[0];   // v appke je „Meno P.“ — priezvisko doplní doklad
      const body = { verification: { callback: returnUrl + '&r=ok', ...(firstName ? { person: { firstName } } : {}), vendorData: stay.id, timestamp: new Date().toISOString() } };
      const r = await f(base + '/v1/sessions', { method: 'POST', headers: { 'X-AUTH-CLIENT': env('VERIFF_API_KEY'), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j || !j.verification || !j.verification.url) throw new Error('veriff_session_' + r.status);
      const url = j.verification.url;
      return { ref: j.verification.id, url: url + (url.includes('?') ? '&' : '?') + 'lang=' + encodeURIComponent(lang || 'en') };
    },
    async verify(rawBody, headers) {
      const key = env('VERIFF_SHARED_SECRET'); if (!key) return false;
      if (env('VERIFF_API_KEY') && !safeEqual(headers.get('x-auth-client') || '', env('VERIFF_API_KEY'))) return false;
      return safeEqual(await hmacHex(key, rawBody), headers.get('x-hmac-signature') || '');
    },
    parse(p) {
      const v = p && p.verification;
      if (!v || !v.id || !v.status) return null;   // udalosti started/submitted nemajú rozhodnutie
      const s = String(v.status).toLowerCase();
      const status = s === 'approved' ? 'approved' : s === 'declined' ? 'declined' : s === 'resubmission_requested' || s === 'review' ? 'review' : 'pending';
      const person = v.person || {}, doc = v.document || {};
      return { ref: v.id, stayId: v.vendorData || null, status,
        data: pick({ firstName: person.firstName, lastName: person.lastName, dob: person.dateOfBirth, nationality: person.nationality, docType: doc.type, docNumber: doc.number, docExpiry: doc.validUntil, docCountry: doc.country }) };
    },
  },
};
export function activeProvider() {
  const p = PROVIDERS[String(env('IDENTITY_PROVIDER', '')).toLowerCase()];
  return p && p.configured() ? p : null;
}
