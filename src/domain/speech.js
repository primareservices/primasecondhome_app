// Diktovanie cez Web Speech API (vzor DictateButton v PRIMA RE SERVICE), v jazyku hosťa.
// Chrome/Android a Safari iOS 14.5+ ho majú; kde chýba, tlačidlo sa nezobrazí.
const SPEECH_LANG = {
  sk: 'sk-SK', en: 'en-US', uk: 'uk-UA', ru: 'ru-RU', sr: 'sr-RS', ro: 'ro-RO',
  hu: 'hu-HU', vi: 'vi-VN', hi: 'hi-IN', ne: 'ne-NP', uz: 'uz-UZ', tl: 'fil-PH',
};
export function speechLangFor(lang) { return SPEECH_LANG[lang] || 'en-US'; }
export function getSpeechRecognition(win) {
  const w = win || (typeof window !== 'undefined' ? window : null);
  if (!w) return null;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}
