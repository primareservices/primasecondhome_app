// Prevádzky PRIMA. `id` a `qr` sú zosúladené s PRIMA RE SERVICE (properties.id = p_<kód>,
// kód na QR štítku = názov bez prefixu „PRIMA"), aby sa hlásenia hostí dali napojiť na tickety.
// Verejné údaje z primare.sk / ubytovnaprima.sk (september 2026). Polia označené null
// (WiFi, messengery, recepčné telefóny niektorých budov) doplní office — v UI sa zobrazí
// „Opýtaj sa na recepcii", nikdy vymyslená hodnota.
import { NETWORK } from './app-config.js';

export const PROPERTIES = [
  {
    id: 'p_ic15', qr: 'IC15', name: 'PRIMA IC 15', city: 'Bratislava', district: 'Ružinov',
    street: 'Ivanská cesta 15', postal: '821 04 Bratislava',
    mapQuery: 'Ivanská cesta 16733/15, 821 04 Bratislava',
    reception: { phone: NETWORK.officePhone, email: NETWORK.officeEmail, hours247: true },
    messengers: { whatsapp: null, viber: null, telegram: null },
    arrivalTipKey: 'ic15',
    wifi: { ssid: null, password: null },
    beds: null, blocks: null, parkingSpots: null,
    features: ['kitchenPerFloor', 'fridgeInRoom', 'laundry', 'parking', 'turnstiles', 'reception247', 'dailyCleaning'],
    quietHours: '22:00–06:00', cleaningDays: 'workdays',
  },
  {
    id: 'p_ic23', qr: 'IC23', name: 'PRIMA IC 23', city: 'Bratislava', district: 'Ružinov',
    street: 'Ivanská cesta 23', postal: '821 04 Bratislava',
    mapQuery: 'Ivanská cesta 23, 821 04 Bratislava',
    reception: { phone: NETWORK.officePhone, email: NETWORK.officeEmail, hours247: true },
    messengers: { whatsapp: null, viber: null, telegram: null },
    arrivalTipKey: 'ic23',
    wifi: { ssid: null, password: null },
    beds: 279, blocks: null, parkingSpots: null,
    features: ['kitchenPerFloor', 'fridgeInRoom', 'laundry', 'parking', 'turnstiles', 'reception247', 'dailyCleaning', 'doubleRooms'],
    quietHours: '22:00–06:00', cleaningDays: 'workdays',
  },
  {
    id: 'p_tarif', qr: 'TARIF', name: 'PRIMA Tarif', city: 'Bratislava', district: 'Nové Mesto',
    street: 'Stará Vajnorská 39A', postal: '831 04 Bratislava',
    mapQuery: 'Stará Vajnorská 39A, Bratislava',
    reception: { phone: '+421 2 3310 4404', email: 'tarif@ubytovnaprima.sk', hours247: true },
    messengers: { whatsapp: null, viber: null, telegram: null },
    arrivalTipKey: 'tarif',
    wifi: { ssid: null, password: null },
    beds: null, blocks: ['A', 'B', 'C'], parkingSpots: null,
    features: ['kitchenPerFloor', 'fridgeInRoom', 'laundry', 'parking', 'turnstiles', 'reception247', 'dailyCleaning', 'biometrics'],
    quietHours: '22:00–06:00', cleaningDays: 'workdays',
  },
  {
    id: 'p_nukleon', qr: 'NUKLEON', name: 'PRIMA Nukleon', city: 'Trnava', district: null,
    street: 'Jána Bottu 2', postal: '917 01 Trnava',
    mapQuery: 'Jána Bottu 2, 917 01 Trnava',
    reception: { phone: NETWORK.officePhone, email: NETWORK.officeEmail, hours247: true },
    messengers: { whatsapp: null, viber: null, telegram: null },
    arrivalTipKey: 'nukleon',
    wifi: { ssid: null, password: null },
    beds: 590, blocks: null, parkingSpots: null,
    features: ['kitchenPerFloor', 'laundry', 'parking', 'reception247', 'dailyCleaning'],
    quietHours: '22:00–06:00', cleaningDays: 'workdays',
  },
  {
    id: 'p_nitra', qr: 'NITRA', name: 'PRIMA Nitra', city: 'Nitra', district: null,
    street: 'Čajkovského 2', postal: '949 11 Nitra',
    mapQuery: 'Čajkovského 2, 949 11 Nitra',
    reception: { phone: '+421 2 3310 4403', email: 'nr@ubytovnaprima.sk', hours247: true },
    messengers: { whatsapp: null, viber: null, telegram: null },
    arrivalTipKey: 'nitra',
    wifi: { ssid: null, password: null },
    beds: 350, blocks: null, parkingSpots: 25,
    features: ['kitchenPerFloor', 'laundry', 'parking', 'reception247', 'dailyCleaning'],
    quietHours: '22:00–06:00', cleaningDays: 'workdays',
  },
  {
    id: 'p_galanta', qr: 'GALANTA', name: 'PRIMA Galanta', city: 'Galanta', district: null,
    street: 'Matúškovská cesta', postal: '924 01 Galanta',
    mapQuery: 'Matúškovská cesta, Galanta',
    reception: { phone: NETWORK.officePhone, email: NETWORK.officeEmail, hours247: true },
    messengers: { whatsapp: null, viber: null, telegram: null },
    arrivalTipKey: 'galanta',
    wifi: { ssid: null, password: null },
    beds: 132, blocks: null, parkingSpots: null,
    features: ['kitchenPerFloor', 'laundry', 'parking', 'reception247', 'dailyCleaning'],
    quietHours: '22:00–06:00', cleaningDays: 'workdays',
  },
];
export const PROPERTY_BY_ID = Object.fromEntries(PROPERTIES.map(p => [p.id, p]));
export function propertyById(id) { return PROPERTY_BY_ID[id] || null; }
export function propertyByQr(code) {
  const key = String(code || '').toUpperCase().replace(/^P_/, '');
  return PROPERTIES.find(p => p.qr === key) || null;
}
export function mapUrl(p) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.mapQuery); }
export function telHref(phone) { return 'tel:' + String(phone || '').replace(/[^\d+]/g, ''); }
export function whatsappHref(phone) { return 'https://wa.me/' + String(phone || '').replace(/[^\d]/g, ''); }
export function viberHref(phone) { return 'viber://chat?number=' + encodeURIComponent(String(phone || '').replace(/[^\d+]/g, '')); }
export function telegramHref(handle) { return 'https://t.me/' + String(handle || '').replace(/^@/, ''); }
