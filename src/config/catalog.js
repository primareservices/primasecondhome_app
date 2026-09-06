// Katalóg hlásení a služieb. Ikony sú NÁZVY z lucide-react (rozlíšené v src/ui/icons.js),
// aby katalóg ostal čistý JS bez JSX a dal sa testovať v Node.
// `re` = kategória v PRIMA RE SERVICE (src/config/catalog.jsx tam), `hk` = ide chyžným.

export const ISSUE_CATEGORIES = [
  { key: 'walls',     t: 'cat.walls',     icon: 'BrickWall',   re: 'Steny',               hk: false },
  { key: 'door',      t: 'cat.door',      icon: 'DoorOpen',    re: 'Dvere',               hk: false },
  { key: 'window',    t: 'cat.window',    icon: 'AppWindow',   re: 'Okná',                hk: false },
  { key: 'floor',     t: 'cat.floor',     icon: 'Grid2x2',     re: 'Podlaha',             hk: false },
  { key: 'furniture', t: 'cat.furniture', icon: 'Bed',         re: 'Nábytok',             hk: false },
  { key: 'electric',  t: 'cat.electric',  icon: 'Zap',         re: 'Elektro (EI)',        hk: false },
  { key: 'water',     t: 'cat.water',     icon: 'Droplets',    re: 'Voda/kúrenie (ZTI)',  hk: false },
  { key: 'appliance', t: 'cat.appliance', icon: 'Refrigerator', re: 'Spotrebiče',         hk: false },
  { key: 'clean',     t: 'cat.clean',     icon: 'Sparkles',    re: 'Upratovanie / čistota', hk: true },
  { key: 'linen',     t: 'cat.linen',     icon: 'Shirt',       re: 'Bielizeň',            hk: true },
  { key: 'pests',     t: 'cat.pests',     icon: 'Bug',         re: 'Deratizácia',         hk: true, ddd: true },
  { key: 'wifi',      t: 'cat.wifi',      icon: 'Wifi',        re: 'IT',                  hk: false },
  { key: 'noise',     t: 'cat.noise',     icon: 'Volume2',     re: null,                  hk: false, reception: true },
  { key: 'other',     t: 'cat.other',     icon: 'CircleHelp',  re: 'Iné',                 hk: false },
];
export const ISSUE_BY_KEY = Object.fromEntries(ISSUE_CATEGORIES.map(c => [c.key, c]));

export const PLACES = [
  { key: 'room',     t: 'place.myRoom' },
  { key: 'kitchen',  t: 'place.kitchen',  reLabel: 'Kuchyňa' },
  { key: 'bathroom', t: 'place.bathroom', reLabel: 'Toalety' },
  { key: 'corridor', t: 'place.corridor', reLabel: 'Chodba poschodia' },
  { key: 'laundry',  t: 'place.laundry',  reLabel: 'Práčovňa' },
  { key: 'outside',  t: 'place.outside',  reLabel: 'Exteriér' },
  { key: 'other',    t: 'place.other',    reLabel: 'Iné' },
];

export const URGENCY = [
  { key: 'low',    t: 'report.urgency.low',    priority: 'Nízka' },
  { key: 'normal', t: 'report.urgency.normal', priority: 'Stredná' },
  { key: 'high',   t: 'report.urgency.high',   priority: 'Vysoká' },
];

// Služby. `route`: 'reception' (vybaví recepcia / chyžné), 'coordinator' (preposiela sa
// koordinátorovi klienta — PRIMA o tom nerozhoduje), 'office' (kancelária).
export const SERVICES = [
  { key: 'laundry',  t: 'svc.laundry',  sub: 'svc.laundrySub',  icon: 'WashingMachine', route: 'reception', fields: ['bags', 'slot', 'note'], price: '4 €' },
  { key: 'cleaning', t: 'svc.cleaning', sub: 'svc.cleaningSub', icon: 'Sparkles',       route: 'reception', fields: ['slot', 'note'] },
  { key: 'linen',    t: 'svc.linen',    sub: 'svc.linenSub',    icon: 'Shirt',          route: 'reception', fields: ['slot', 'note'] },
  { key: 'parking',  t: 'svc.parking',  sub: 'svc.parkingSub',  icon: 'CarFront',       route: 'reception', fields: ['plate', 'note'] },
  { key: 'card',     t: 'svc.card',     sub: 'svc.cardSub',     icon: 'CreditCard',     route: 'reception', fields: ['cardReason', 'note'] },
  { key: 'room',     t: 'svc.room',     sub: 'svc.roomSub',     icon: 'ArrowLeftRight', route: 'coordinator', fields: ['roomReason', 'note'] },
  { key: 'other',    t: 'svc.other',    sub: 'svc.otherSub',    icon: 'MessageSquare',  route: 'reception', fields: ['note'] },
];
export const SERVICE_BY_KEY = Object.fromEntries(SERVICES.map(s => [s.key, s]));

export const SLOTS = [
  { key: 'morning',   t: 'svc.slot.morning' },
  { key: 'afternoon', t: 'svc.slot.afternoon' },
  { key: 'evening',   t: 'svc.slot.evening' },
];
export const CARD_REASONS = [
  { key: 'lost',    t: 'svc.card.lost' },
  { key: 'blocked', t: 'svc.card.blocked' },
  { key: 'damaged', t: 'svc.card.damaged' },
];
export const DOC_PURPOSES = [
  { key: 'new',     t: 'docs.purpose.new' },
  { key: 'renewal', t: 'docs.purpose.renewal' },
  { key: 'other',   t: 'docs.purpose.other' },
];
export const DOC_PICKUPS = [
  { key: 'reception', t: 'docs.pickup.reception' },
  { key: 'agency',    t: 'docs.pickup.agency' },
];
