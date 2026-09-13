// Webhook z DB: INSERT do guest_requests → ticket v PRIMA RE SERVICE (tabuľka tickets, data = celý
// objekt) + riadok notifications pre personál; DeepL doplní SK/EN preklad textu hosťa.
// Hosť nikdy nezapisuje do RE SERVICE priamo (politika tickets_p_insert vyžaduje tickets.write).
import { checkWebhookSecret, cors, json, readJson } from '../_shared/http.js';
import { env } from '../_shared/env.js';
import { own as ownClient, reService } from '../_shared/supa.js';
import { translate } from '../_shared/deepl.js';
import { buildTicketFromRequest, staffNotification, ticketToRow } from '../_shared/ticket-bridge.js';

export const shortId = (uuid) => String(uuid || '').replace(/-/g, '').slice(0, 10).toUpperCase();

export async function handle(req, deps = {}) {
  const pre = cors(req); if (pre) return pre;
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!checkWebhookSecret(req)) return json({ error: 'forbidden' }, 403);
  if (!env('RE_SERVICE_URL') || !env('RE_SERVICE_SERVICE_KEY')) return json({ error: 'missing_re_service_secrets' }, 503);
  const body = await readJson(req);
  const record = body && (body.record || body);
  if (!record || !record.id || record.kind !== 'issue') return json({ skipped: 'not_issue' });
  if (record.external_ref) return json({ skipped: 'already_bridged' });
  const own = deps.own || ownClient();
  const re = deps.re || reService();
  const stays = await own.rest('guest_stays?select=id,property_id,room,display_name,lang&id=eq.' + record.stay_id);
  const stay = Array.isArray(stays) ? stays[0] : stays;
  if (!stay) return json({ error: 'stay_not_found' }, 404);
  const stayShape = { id: stay.id, propertyId: stay.property_id, room: stay.room };

  // preklad textu hosťa pre personál (SK + EN); pri chybe DeepL ide originál
  const tr = record.text ? await translate(record.text, ['sk', 'en'], { source: record.lang, fetchImpl: deps.fetchImpl }) : {};
  const payload = record.payload || {};
  const reqShape = { id: shortId(record.id), kind: 'issue', category: record.category, place: record.place, room: record.room, roomOther: payload.roomOther, urgency: payload.urgency,
    text: record.text || '', textSk: tr.sk || null, textEn: tr.en || null, lang: record.lang || null, photos: [] };
  const ticket = buildTicketFromRequest(reqShape, stayShape, null, { now: new Date(record.created_at || Date.now()) });
  if (!ticket) return json({ skipped: 'reception_only' });   // hluk / správanie rieši recepcia

  // fotky: podpísané odkazy z bucketu hostí (30 dní) do popisu — personál ich otvorí bez ďalších práv
  const paths = Array.isArray(record.photos) ? record.photos : [];
  const urls = [];
  for (const p of paths) {
    try { const u = await own.sign('guest-photos', p, 30 * 24 * 3600); if (u) urls.push(u); } catch {}
  }
  if (urls.length) ticket.description += '\n\nFotky hosťa:\n' + urls.join('\n');
  ticket.source.guestName = stay.display_name || null;
  ticket.source.guestRequestRef = record.ref || null;

  const row = ticketToRow(ticket);
  await re.rest('tickets?on_conflict=id', { method: 'POST', body: [row], prefer: 'resolution=merge-duplicates,return=minimal' });
  try { await re.rest('notifications', { method: 'POST', body: [{ ...staffNotification(ticket), created_at: new Date().toISOString() }], prefer: 'return=minimal' }); }
  catch (e) { /* notifikácia je bonus; ticket už existuje */ }
  await own.rest('guest_requests?id=eq.' + record.id, { method: 'PATCH', body: { external_ref: ticket.id, text_sk: tr.sk || null, text_en: tr.en || null }, prefer: 'return=minimal' });
  return json({ ok: true, ticket: ticket.id });
}
