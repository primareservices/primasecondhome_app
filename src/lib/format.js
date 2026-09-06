import { localeOf } from '../config/languages.js';

export function fmtDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(localeOf(lang), { day: 'numeric', month: 'short', year: 'numeric' });
}
export function fmtTime(iso, lang) {
  const d = new Date(iso);
  return d.toLocaleTimeString(localeOf(lang), { hour: '2-digit', minute: '2-digit' });
}
export function fmtDateTime(iso, lang) { return fmtDate(iso, lang) + ' ' + fmtTime(iso, lang); }
// Dnes / včera / dátum — pre zoznamy.
export function fmtDay(iso, lang, t) {
  const d = new Date(iso); const now = new Date();
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, now)) return t('common.today') + ' ' + fmtTime(iso, lang);
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (sameDay(d, y)) return t('common.yesterday') + ' ' + fmtTime(iso, lang);
  return fmtDate(iso, lang);
}
export function todayISO() { return new Date().toISOString().slice(0, 10); }
