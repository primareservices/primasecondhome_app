// Stavy žiadostí hostí. Kľúče ticketov v PRIMA RE SERVICE sú slovenské reťazce
// (STATUS_KEYS v jeho src/config/domain.jsx) — tu je mapa oboma smermi, aby sa
// stav ticketu dal premietnuť hosťovi bez prekladania na strane RE SERVICE.
export const STATUS = {
  reported:   { t: 'status.reported',   re: 'Nahlásené',     tone: 'muted',   open: true },
  assigned:   { t: 'status.assigned',   re: 'Priradené',     tone: 'accent',  open: true },
  inProgress: { t: 'status.inProgress', re: 'Riešim',        tone: 'info',    open: true },
  longer:     { t: 'status.longer',     re: 'Dlhšia oprava', tone: 'warning', open: true },
  major:      { t: 'status.major',      re: 'Veľká chyba',   tone: 'danger',  open: true },
  deferred:   { t: 'status.deferred',   re: 'Odložené',      tone: 'muted',   open: true },
  resolved:   { t: 'status.resolved',   re: 'Vyriešené',     tone: 'success', open: false },
  ready:      { t: 'status.ready',      re: null,            tone: 'success', open: false },
  forwarded:  { t: 'status.forwarded',  re: null,            tone: 'info',    open: true },
  cancelled:  { t: 'status.cancelled',  re: null,            tone: 'muted',   open: false },
};
export const STATUS_KEYS = Object.keys(STATUS);
export function statusMeta(key) { return STATUS[key] || STATUS.reported; }
export function isOpen(req) { return !!req && statusMeta(req.status).open; }
export function statusFromTicket(reStatus) {
  const hit = Object.entries(STATUS).find(([, v]) => v.re === reStatus);
  return hit ? hit[0] : 'reported';
}
