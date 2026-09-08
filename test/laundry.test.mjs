import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availability, canCancel, laundrySlots, slotLabel, upcomingBooking } from '../src/domain/laundry.js';

const facts = { laundry: { slotHours: 2, machines: 4, hours: [7, 23] } };
test('slots cover opening hours in 2-hour steps', () => {
  assert.deepEqual(laundrySlots(facts), [7, 9, 11, 13, 15, 17, 19, 21]);
  assert.equal(slotLabel(17), '17:00–19:00');
});
test('availability marks past slots, own bookings and demo occupancy', () => {
  const now = new Date('2026-09-08T16:30:00');
  const mine = [{ day: '2026-09-08', start: 17, machine: 2, status: 'booked' }];
  const av = availability(facts, '2026-09-08', mine, now);
  const s15 = av.find(s => s.start === 15), s17 = av.find(s => s.start === 17);
  assert.equal(s15.past, false, '15–17 still running');
  assert.equal(av.find(s => s.start === 13).past, true);
  assert.equal(s17.machines[1].mine, true);
  assert.equal(s17.machines[1].taken, false);
  const total = av.reduce((n, s) => n + s.machines.filter(m => m.taken).length, 0);
  assert.ok(total > 0 && total < av.length * 4, 'some but not all taken');
});
test('cancel allowed only more than 1 hour before start', () => {
  const b = { day: '2026-09-08', start: 18, status: 'booked' };
  assert.equal(canCancel(b, new Date('2026-09-08T16:59:00')), true);
  assert.equal(canCancel(b, new Date('2026-09-08T17:01:00')), false);
  assert.equal(canCancel({ ...b, status: 'cancelled' }, new Date('2026-09-08T10:00:00')), false);
});
test('upcoming booking skips finished and cancelled ones', () => {
  const now = new Date('2026-09-08T16:00:00');
  const list = [
    { day: '2026-09-08', start: 9, len: 2, machine: 1, status: 'booked' },
    { day: '2026-09-08', start: 18, len: 2, machine: 2, status: 'cancelled' },
    { day: '2026-09-09', start: 7, len: 2, machine: 3, status: 'booked' },
  ];
  assert.equal(upcomingBooking(list, now).machine, 3);
});
