// Krátke texty push notifikácií v 12 jazykoch appky (kľúče: statusUpdate, resolved, message, announcement).
export const PUSH_TEXTS = {
  sk: { statusUpdate: 'Hlásenie {ref}: {status}', resolved: 'Hlásenie {ref} je vyriešené', message: 'Nová správa z recepcie', announcement: 'Oznam' },
  en: { statusUpdate: 'Request {ref}: {status}', resolved: 'Request {ref} is resolved', message: 'New message from reception', announcement: 'Announcement' },
  uk: { statusUpdate: 'Запит {ref}: {status}', resolved: 'Запит {ref} вирішено', message: 'Нове повідомлення від рецепції', announcement: 'Оголошення' },
  ru: { statusUpdate: 'Запрос {ref}: {status}', resolved: 'Запрос {ref} решён', message: 'Новое сообщение от ресепшена', announcement: 'Объявление' },
  sr: { statusUpdate: 'Zahtev {ref}: {status}', resolved: 'Zahtev {ref} je rešen', message: 'Nova poruka sa recepcije', announcement: 'Obaveštenje' },
  ro: { statusUpdate: 'Solicitarea {ref}: {status}', resolved: 'Solicitarea {ref} este rezolvată', message: 'Mesaj nou de la recepție', announcement: 'Anunț' },
  hu: { statusUpdate: '{ref} kérelem: {status}', resolved: 'A(z) {ref} kérelem megoldva', message: 'Új üzenet a recepciótól', announcement: 'Közlemény' },
  vi: { statusUpdate: 'Yêu cầu {ref}: {status}', resolved: 'Yêu cầu {ref} đã được giải quyết', message: 'Tin nhắn mới từ lễ tân', announcement: 'Thông báo' },
  hi: { statusUpdate: 'अनुरोध {ref}: {status}', resolved: 'अनुरोध {ref} हल हो गया', message: 'रिसेप्शन से नया संदेश', announcement: 'सूचना' },
  ne: { statusUpdate: 'अनुरोध {ref}: {status}', resolved: 'अनुरोध {ref} समाधान भयो', message: 'रिसेप्सनबाट नयाँ सन्देश', announcement: 'सूचना' },
  uz: { statusUpdate: 'So‘rov {ref}: {status}', resolved: 'So‘rov {ref} hal qilindi', message: 'Qabulxonadan yangi xabar', announcement: 'E’lon' },
  tl: { statusUpdate: 'Kahilingan {ref}: {status}', resolved: 'Nalutas na ang kahilingan {ref}', message: 'Bagong mensahe mula sa reception', announcement: 'Abiso' },
};
// Názvy stavov pre push (krátke, zrkadlo i18n status.*).
export const STATUS_TEXTS = {
  sk: { reported: 'nahlásené', assigned: 'priradené', inProgress: 'rieši sa', longer: 'dlhšia oprava', major: 'väčšia porucha', deferred: 'odložené', resolved: 'vyriešené' },
  en: { reported: 'reported', assigned: 'assigned', inProgress: 'in progress', longer: 'longer repair', major: 'major fault', deferred: 'deferred', resolved: 'resolved' },
  uk: { reported: 'повідомлено', assigned: 'призначено', inProgress: 'у роботі', longer: 'триваліший ремонт', major: 'серйозна несправність', deferred: 'відкладено', resolved: 'вирішено' },
  ru: { reported: 'сообщено', assigned: 'назначено', inProgress: 'в работе', longer: 'длительный ремонт', major: 'серьёзная неисправность', deferred: 'отложено', resolved: 'решено' },
};
export function pushText(lang, key, vars = {}) {
  const d = PUSH_TEXTS[lang] || PUSH_TEXTS.en;
  const s = d[key] || PUSH_TEXTS.en[key] || key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ''));
}
export function statusText(lang, status) { const d = STATUS_TEXTS[lang] || STATUS_TEXTS.en; return d[status] || STATUS_TEXTS.en[status] || status; }
