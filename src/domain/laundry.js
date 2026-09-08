// Rezervácia práčovne (režim 'booking'): deň → 2-hodinové okno → práčka.
// Obsadenosť v DEMO je deterministická (hash dňa/okna/práčky), aby ukážka vyzerala živo
// a rovnako na každom zariadení; v1.1 príde z tabuľky guest_laundry_bookings.
export function laundrySlots(facts) {
  const hours = (facts && facts.laundry && facts.laundry.hours) || [7, 23];
  const len = (facts && facts.laundry && facts.laundry.slotHours) || 2;
  const out = [];
  for (let h = hours[0]; h + len <= hours[1]; h += len) out.push(h);
  return out;
}
export const pad2 = (n) => String(n).padStart(2, '0');
export function slotLabel(start, len = 2) { return pad2(start) + ':00–' + pad2(start + len) + ':00'; }
export function dayISO(d) { const x = new Date(d); return x.getFullYear() + '-' + pad2(x.getMonth() + 1) + '-' + pad2(x.getDate()); }
function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
// Ukážková obsadenosť: ~40 % okien obsadených, prvé okná dňa a večer viac.
export function demoTaken(day, start, machine) {
  const base = hash(day + '|' + start + '|' + machine);
  const bias = start >= 17 ? 0.15 : start < 9 ? 0.1 : 0;
  return base < 0.35 + bias;
}
export function availability(facts, day, bookings, now = new Date()) {
  const len = (facts && facts.laundry && facts.laundry.slotHours) || 2;
  const machines = (facts && facts.laundry && facts.laundry.machines) || 4;
  const today = dayISO(now);
  return laundrySlots(facts).map(start => {
    const past = day < today || (day === today && now.getHours() >= start + len);
    const ms = [];
    for (let m = 1; m <= machines; m++) {
      const mine = bookings.some(b => b.day === day && b.start === start && b.machine === m && b.status !== 'cancelled');
      const others = bookings.some(b => b.day === day && b.start === start && b.machine === m && b.status !== 'cancelled' && b.foreign);
      ms.push({ n: m, mine, taken: !mine && (others || demoTaken(day, start, m)), past });
    }
    return { start, len, label: slotLabel(start, len), past, machines: ms };
  });
}
export function nextDays(n, now = new Date()) {
  const out = [];
  for (let i = 0; i < n; i++) { const d = new Date(now); d.setDate(d.getDate() + i); out.push(dayISO(d)); }
  return out;
}
// Zrušenie do 1 hodiny pred začiatkom.
export function canCancel(b, now = new Date()) {
  const startAt = new Date(b.day + 'T' + pad2(b.start) + ':00:00');
  return b.status !== 'cancelled' && startAt.getTime() - now.getTime() > 60 * 60 * 1000;
}
export function upcomingBooking(bookings, now = new Date()) {
  const list = bookings.filter(b => b.status !== 'cancelled').map(b => ({ ...b, endAt: new Date(b.day + 'T' + pad2(b.start + (b.len || 2)) + ':00:00') }))
    .filter(b => b.endAt.getTime() > now.getTime()).sort((a, b) => (a.day + a.start < b.day + b.start ? -1 : 1));
  return list[0] || null;
}
