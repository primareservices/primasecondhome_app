// PRIMA SECOND HOME · Edge Function "guest-request-bridge" (v1.1, návrh — nenasadené)
// Volá ju Database Webhook na INSERT do guest_requests (kind = 'issue').
// Vytvorí ticket v PRIMA RE SERVICE (tabuľka tickets, stĺpec data = celý objekt) a zapíše
// external_ref späť do guest_requests. Mapa kategórií je zrkadlom src/domain/ticket-bridge.js —
// pri zmene tam zmeň aj tu (v repozitári je test, ktorý drží tvar ticketu).
// Secrets: RE_SERVICE_URL, RE_SERVICE_SERVICE_KEY (service_role RE SERVICE), SUPABASE_* dodáva platforma.
import { createClient } from 'npm:@supabase/supabase-js@2';

const RE_URL = Deno.env.get('RE_SERVICE_URL') ?? '';
const RE_KEY = Deno.env.get('RE_SERVICE_SERVICE_KEY') ?? '';
const own = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const CATEGORY = {
  walls: ['Steny', false], door: ['Dvere', false], window: ['Okná', false], floor: ['Podlaha', false],
  furniture: ['Nábytok', false], electric: ['Elektro (EI)', false], water: ['Voda/kúrenie (ZTI)', false],
  appliance: ['Spotrebiče', false], clean: ['Upratovanie / čistota', true], linen: ['Bielizeň', true],
  pests: ['Deratizácia', true], wifi: ['IT', false], other: ['Iné', false],
} as Record<string, [string, boolean]>;
const PLACE_LABEL = { kitchen: 'Kuchyňa', bathroom: 'Toalety', corridor: 'Chodba poschodia', laundry: 'Práčovňa', outside: 'Exteriér', other: 'Iné' } as Record<string, string>;
const PRIORITY = { low: 'Nízka', normal: 'Stredná', high: 'Vysoká' } as Record<string, string>;

function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }); }

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!RE_URL || !RE_KEY) return json({ error: 'missing_re_service_secrets' }, 503);
  const { record } = await req.json();
  if (!record || record.kind !== 'issue' || record.external_ref) return json({ skipped: true });
  const cat = CATEGORY[record.category] ?? CATEGORY.other;
  if (record.category === 'noise') return json({ skipped: 'reception' });   // hluk → recepcia, nie ticket

  const { data: stay } = await own.from('guest_stays').select('property_id, room').eq('id', record.stay_id).single();
  if (!stay) return json({ error: 'stay_not_found' }, 404);
  const room = record.place === 'room' ? (record.room || stay.room)
    : (PLACE_LABEL[record.place] ?? 'Iné') + (record.payload?.roomOther ? ' ' + record.payload.roomOther : '');
  const description = [record.text ?? '', record.text_sk ? '[SK] ' + record.text_sk : '', record.text_en ? '[EN] ' + record.text_en : ''].filter(Boolean).join('\n\n');
  const ticket = {
    id: 'G-' + record.id, propertyId: stay.property_id, room,
    category: cat[0], forHousekeeping: cat[1], priority: PRIORITY[record.payload?.urgency] ?? 'Stredná',
    status: 'Nahlásené', title: (record.text_en || record.text || cat[0]).slice(0, 80), description,
    photos: [], createdAt: new Date().toISOString(), createdBy: 'guest-app',
    source: { app: 'second-home', requestId: record.id, lang: record.lang, ddd: record.category === 'pests' },
  };
  // RE SERVICE: tabuľka tickets = id + indexované stĺpce + celý objekt v `data` (jeho src/data/tickets-tb.js)
  const r = await fetch(RE_URL + '/rest/v1/tickets?on_conflict=id', {
    method: 'POST',
    headers: { apikey: RE_KEY, Authorization: 'Bearer ' + RE_KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{ id: ticket.id, property_id: ticket.propertyId, status: ticket.status, for_housekeeping: ticket.forHousekeeping, created_at: ticket.createdAt, data: ticket }]),
  });
  if (!r.ok) return json({ error: 'tickets_upsert_failed_' + r.status }, 502);
  await own.from('guest_requests').update({ external_ref: ticket.id, updated_at: new Date().toISOString() }).eq('id', record.id);
  return json({ ok: true, ticket: ticket.id });
});
