// Povolenie na pobyt: odpočet a pripomienky 90 / 60 / 30 dní pred vypršaním
// (content pack TARIF, karta „Your residence permit"). Push príde vo v1.1; tu je čistý výpočet.
export const PERMIT_REMINDERS = [90, 60, 30];
export function daysUntil(iso, now = new Date()) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  const n = new Date(now); n.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - n.getTime()) / 864e5);
}
export function permitStatus(expiryISO, now = new Date()) {
  const days = daysUntil(expiryISO, now);
  if (days === null) return { set: false, days: null, expired: false, tone: 'muted', reminders: PERMIT_REMINDERS.map(d => ({ days: d, due: false })) };
  return {
    set: true, days, expired: days < 0,
    tone: days < 0 ? 'danger' : days <= 30 ? 'danger' : days <= 90 ? 'warning' : 'success',
    reminders: PERMIT_REMINDERS.map(d => ({ days: d, due: days <= d })),
  };
}
