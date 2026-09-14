// ── Modul Hostia: prístup do Supabase projektu hostí (druhé prihlásenie) ─────────────
// TOOLS beží nad vlastným projektom; hostia majú oddelený projekt. Office účet (e-mail + heslo)
// vzniká v projekte hostí a riadok v office_users určuje roly a budovy (docs/SETUP_SUPABASE.md §6b).
import { createClient } from '@supabase/supabase-js';
import { HOME_SUPABASE_URL, HOME_SUPABASE_ANON_KEY } from '../../config.js';

export const home = HOME_SUPABASE_URL && HOME_SUPABASE_ANON_KEY
  ? createClient(HOME_SUPABASE_URL, HOME_SUPABASE_ANON_KEY, { auth: { storageKey: 'prima-home-office', persistSession: true, autoRefreshToken: true } })
  : null;
const ok = (r) => { if (r.error) throw r.error; return r.data; };

export async function getOfficeSession() { return ok(await home.auth.getSession()).session; }
export function onAuth(cb) { return home.auth.onAuthStateChange((_e, s) => cb(s)); }
export async function signIn(email, password) { return ok(await home.auth.signInWithPassword({ email, password })); }
export async function signOut() { await home.auth.signOut(); }
export async function myOffice() { return ok(await home.from('office_users').select('*').maybeSingle()); }

// pobyty
export async function listStays({ propertyId, active = true } = {}) {
  let q = home.from('guest_stays').select('*').order('check_in', { ascending: false }).limit(500);
  if (propertyId) q = q.eq('property_id', propertyId);
  if (active) q = q.is('closed_at', null);
  return ok(await q);
}
export async function createStay(s) {
  return ok(await home.rpc('office_create_stay', { p_property: s.propertyId, p_room: s.room, p_surname: s.surname, p_display_name: s.displayName, p_company: s.company || null,
    p_check_in: s.checkIn, p_check_out: s.checkOut || null, p_lang: s.lang || 'en', p_email: s.email || null, p_coordinator: s.coordinator || null, p_code: s.code, p_code_days: s.codeDays || 14 }));
}
export async function issueCode(stayId, code, days = 14) { return ok(await home.rpc('office_issue_code', { p_stay: stayId, p_code: code, p_days: days })); }
export async function closeStay(id) { return ok(await home.from('guest_stays').update({ closed_at: new Date().toISOString() }).eq('id', id)); }
export async function updateStay(id, patch) { return ok(await home.from('guest_stays').update(patch).eq('id', id)); }
export async function signaturesFor(stayIds) { if (!stayIds.length) return []; return ok(await home.from('guest_signatures').select('stay_id, signed_at, pdf_path, email_sent_at').in('stay_id', stayIds)); }
export async function identityFor(stayIds) { if (!stayIds.length) return []; return ok(await home.from('guest_identity').select('stay_id, status, checked_at').in('stay_id', stayIds)); }
export async function signedUrl(path) { return ok(await home.storage.from('guest-docs').createSignedUrl(path, 3600)).signedUrl; }

// žiadosti (služby, doklady, súkromné; poruchy rieši RE SERVICE)
export async function listRequests({ propertyId } = {}) {
  let q = home.from('guest_requests').select('*, guest_stays!inner(id, room, display_name, property_id, client_company, lang)').order('created_at', { ascending: false }).limit(300);
  if (propertyId) q = q.eq('guest_stays.property_id', propertyId);
  return ok(await q);
}
export async function setRequestStatus(req, status, noteSk, noteEn) {
  const at = new Date().toISOString();
  const timeline = [...(Array.isArray(req.timeline) ? req.timeline : []), { at, status, ...(noteSk ? { note: { sk: noteSk, ...(noteEn ? { en: noteEn } : {}) } } : {}) }];
  return ok(await home.from('guest_requests').update({ status, timeline }).eq('id', req.id));
}

// správy
export async function listMessages({ propertyId } = {}) {
  let q = home.from('guest_messages').select('*, guest_stays!inner(id, room, display_name, property_id, lang)').order('created_at', { ascending: true }).limit(1000);
  if (propertyId) q = q.eq('guest_stays.property_id', propertyId);
  return ok(await q);
}
export async function sendReply(stayId, text) { return ok(await home.from('guest_messages').insert({ stay_id: stayId, sender: 'reception', text, lang: 'sk' })); }
export async function markRead(ids) { if (!ids.length) return; return ok(await home.from('guest_messages').update({ read_at: new Date().toISOString() }).in('id', ids)); }

// oznamy
export async function listAnnouncements({ propertyId } = {}) {
  let q = home.from('guest_announcements').select('*').order('valid_from', { ascending: false }).limit(200);
  if (propertyId) q = q.or('property_id.is.null,property_id.eq.' + propertyId);
  return ok(await q);
}
export async function saveAnnouncement(a) { return ok(await home.from('guest_announcements').upsert(a).select().single()); }
export async function deleteAnnouncement(id) { return ok(await home.from('guest_announcements').delete().eq('id', id)); }
// DeepL cez edge funkciu translate (JWT office účtu); max 3 cieľové jazyky na volanie
export async function translateText(text, targets) {
  const out = {};
  for (let i = 0; i < targets.length; i += 3) {
    const { data, error } = await home.functions.invoke('translate', { body: { text, targets: targets.slice(i, i + 3), source: 'sk' } });
    if (error) throw error;
    Object.assign(out, data || {});
  }
  delete out.src;
  return out;
}
export async function listProperties() { return ok(await home.from('properties').select('id, name').order('name')); }
