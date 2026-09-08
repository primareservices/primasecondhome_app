import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysUntil, permitStatus } from '../src/domain/permit.js';

test('days until expiry counts calendar days', () => {
  assert.equal(daysUntil('2026-10-25', new Date('2026-09-08T15:00:00')), 47);
  assert.equal(daysUntil(null), null);
});
test('reminders become due at 90/60/30 days and tone escalates', () => {
  const s = permitStatus('2026-10-25', new Date('2026-09-08T09:00:00'));
  assert.equal(s.days, 47);
  assert.deepEqual(s.reminders.map(r => r.due), [true, true, false]);
  assert.equal(s.tone, 'warning');
  assert.equal(permitStatus('2026-09-20', new Date('2026-09-08')).tone, 'danger');
  assert.equal(permitStatus('2027-03-01', new Date('2026-09-08')).tone, 'success');
  assert.equal(permitStatus('2026-09-01', new Date('2026-09-08')).expired, true);
  assert.equal(permitStatus(null).set, false);
});
