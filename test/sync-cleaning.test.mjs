import test from 'node:test';
import assert from 'node:assert/strict';
import { handle, pickNext } from '../supabase/functions/sync-cleaning/handler.js';
process.env.WEBHOOK_SECRET = 'tajne'; process.env.RE_SERVICE_URL = 'https://re.supabase.co'; process.env.RE_SERVICE_SERVICE_KEY = 'srv';
const post = () => new Request('https://fn/x', { method: 'POST', headers: { 'x-webhook-secret': 'tajne' } });
test('pickNext: izba, potom spoločný kľúč bunky', () => {
  assert.equal(pickNext({ '111/2': '2026-09-15', '111/bunka': '2026-09-14' }, '111/2'), '2026-09-15');
  assert.equal(pickNext({ '111/bunka': '2026-09-14' }, '111/3'), '2026-09-14');
  assert.equal(pickNext({}, 'B214'), null);
});
test('sync-cleaning: plán + posledné upratovanie + stav izby → PATCH na pobyt', async () => {
  const calls = [];
  const own = { rest: async (path, opts = {}) => { calls.push({ path, ...opts }); if (path.startsWith('guest_stays?select')) return [{ id: 's1', property_id: 'p_ic23', room: '111/2' }, { id: 's2', property_id: 'p_ic23', room: '325' }]; return []; } };
  const re = { rest: async (path) => {
    if (path.startsWith('clean_plan')) return [{ id: 'p_ic23|2026-09-16|111/2', plan_date: '2026-09-16' }, { id: 'p_ic23|2026-09-15|111/2', plan_date: '2026-09-15' }];
    if (path.startsWith('cleanings')) return [{ room: '325', created_at: '2026-09-12T09:30:00Z' }];
    if (path.startsWith('room_status')) return [{ id: 'p_ic23|111/2', status: 'clean' }];
    return []; } };
  const res = await (await handle(post(), { own, re })).json();
  assert.equal(res.updated, 2);
  const p1 = calls.find(c => c.path === 'guest_stays?id=eq.s1').body; assert.equal(p1.next_cleaning, '2026-09-15'); assert.equal(p1.room_state, 'clean'); assert.equal(p1.last_cleaning, null);
  const p2 = calls.find(c => c.path === 'guest_stays?id=eq.s2').body; assert.equal(p2.next_cleaning, null); assert.equal(p2.last_cleaning, '2026-09-12');
});
