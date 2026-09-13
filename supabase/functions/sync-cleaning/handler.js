// Cron (každú hodinu): plán upratovania z PRIMA RE SERVICE → next_cleaning / last_cleaning / room_state
// na aktívnych pobytoch. Kľúče RE SERVICE: clean_plan.id = "<pid>|<YYYY-MM-DD>|<izba>", cleanings.room,
// room_status.id = "<pid>|<izba>". Izba v bunke ('111/2') skúsi aj spoločný kľúč bunky ('111/bunka').
import { checkWebhookSecret, cors, json } from '../_shared/http.js';
import { env } from '../_shared/env.js';
import { own as ownClient, reService } from '../_shared/supa.js';

const day = (d) => new Date(d).toISOString().slice(0, 10);
export function pickNext(nextByRoom, room) {
  if (nextByRoom[room]) return nextByRoom[room];
  const i = String(room).indexOf('/');
  return i > 0 ? nextByRoom[String(room).slice(0, i) + '/bunka'] || null : null;
}
export async function handle(req, deps = {}) {
  const pre = cors(req); if (pre) return pre;
  if (!checkWebhookSecret(req)) return json({ error: 'forbidden' }, 403);
  if (!env('RE_SERVICE_URL') || !env('RE_SERVICE_SERVICE_KEY')) return json({ error: 'missing_re_service_secrets' }, 503);
  const own = deps.own || ownClient();
  const re = deps.re || reService();
  const now = new Date();
  const stays = await own.rest('guest_stays?select=id,property_id,room,next_cleaning,last_cleaning,room_state&closed_at=is.null&anonymized_at=is.null&limit=5000');
  const byProp = {};
  for (const s of stays) (byProp[s.property_id] = byProp[s.property_id] || []).push(s);
  const today = day(now), to = day(now.getTime() + 14 * 864e5), since = new Date(now.getTime() - 30 * 864e5).toISOString();
  let updated = 0;
  for (const [pid, list] of Object.entries(byProp)) {
    let plan = [], cleanings = [], states = [];
    try { plan = await re.rest('clean_plan?select=id,plan_date&plan_date=gte.' + today + '&plan_date=lte.' + to + '&id=like.' + encodeURIComponent(pid + '|*') + '&limit=5000'); } catch { /* bez plánu */ }
    try { cleanings = await re.rest('cleanings?select=room,created_at&property_id=eq.' + encodeURIComponent(pid) + '&created_at=gte.' + since + '&order=created_at.desc&limit=5000'); } catch { /* iný tvar tabuľky */ }
    try { states = await re.rest('room_status?select=id,status,data&id=like.' + encodeURIComponent(pid + '|*') + '&limit=5000'); } catch { /* voliteľné */ }
    const nextByRoom = {};
    for (const p of plan) { const parts = String(p.id).split('|'); const room = parts.slice(2).join('|'); if (!room) continue; if (!nextByRoom[room] || p.plan_date < nextByRoom[room]) nextByRoom[room] = p.plan_date; }
    const lastByRoom = {};
    for (const c of cleanings) if (c.room && !lastByRoom[c.room]) lastByRoom[c.room] = String(c.created_at).slice(0, 10);
    const stateByRoom = {};
    for (const s of states) { const room = String(s.id).split('|').slice(1).join('|'); stateByRoom[room] = s.status || (s.data && s.data.status) || null; }
    for (const st of list) {
      const patch = { next_cleaning: pickNext(nextByRoom, st.room), last_cleaning: lastByRoom[st.room] || null, room_state: stateByRoom[st.room] || null };
      if (patch.next_cleaning === (st.next_cleaning || null) && patch.last_cleaning === (st.last_cleaning || null) && patch.room_state === (st.room_state || null)) continue;   // bez zmeny
      await own.rest('guest_stays?id=eq.' + st.id, { method: 'PATCH', body: { ...patch, cleaning_synced_at: now.toISOString() }, prefer: 'return=minimal' });
      updated += 1;
    }
  }
  return json({ ok: true, stays: stays.length, updated });
}
