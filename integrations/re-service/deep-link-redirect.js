// Návrh pre PRIMA RE SERVICE (src/boot/deep-link.js, hneď po captureQrParam):
// QR štítok na dverách (?qr=IC23:111/2) otvorí hosť bez účtu personálu → presmerovať do hosťovskej appky.
// Vloží sa do RE SERVICE ručne (tento repozitár doň nezapisuje). Personál sa spozná podľa uloženej session
// Supabase (kľúč sb-<ref>-auth-token v localStorage) alebo podľa „Zapamätať si ma“ v sessionStorage.
export function redirectGuestQr(raw, { home = 'https://home.primare.sk' } = {}) {
  try {
    if (!raw) return false;
    const hasStaffSession = Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k)) || Object.keys(sessionStorage).some(k => /^sb-.*-auth-token$/.test(k));
    if (hasStaffSession) return false;
    window.location.replace(home + '/#/report?qr=' + encodeURIComponent(raw));
    return true;
  } catch (e) { return false; }
}
