// Ukážkové dáta pre DEMO režim. Mená a firmy sú vymyslené; budovy a izby zodpovedajú
// reálnym prevádzkam (kódy izieb v tvare RE SERVICE: '111/2' = bunka 111, izba 2).
export const DEMO_STAYS = [
  {
    id: 'stay_demo_ic23', code: 'IC23-1102', surnamePrefix: 'kov', displayName: 'Oleksandr K.',
    propertyId: 'p_ic23', room: '111/2', checkIn: '2026-06-15', checkOut: '2026-12-31',
    company: 'Demo Agency s.r.o.', coordinator: { name: 'Peter Novák', phone: '+421 900 123 456' },
    registeredAt: '2026-06-16', lang: 'uk',
  },
  {
    id: 'stay_demo_nuk', code: 'NUK-0340', surnamePrefix: 'del', displayName: 'Maria D.',
    propertyId: 'p_nukleon', room: '340', checkIn: '2026-08-01', checkOut: '2027-01-31',
    company: 'Demo Manufacturing a.s.', coordinator: { name: 'Jana Horváthová', phone: '+421 900 654 321' },
    registeredAt: null, lang: 'tl',
  },
  {
    id: 'stay_demo_gal', code: 'GAL-0201', surnamePrefix: 'kar', displayName: 'Dilshod K.',
    propertyId: 'p_galanta', room: '201', checkIn: '2026-09-01', checkOut: '2027-03-01',
    company: 'Demo Logistics s.r.o.', coordinator: { name: 'Martin Kováč', phone: '+421 900 111 222' },
    registeredAt: '2026-09-02', lang: 'uz',
  },
  {
    id: 'stay_demo_tarif', code: 'TARIF-2214', surnamePrefix: 'iva', displayName: 'Serhii I.',
    propertyId: 'p_tarif', room: 'B214', checkIn: '2026-06-15', checkOut: '2026-12-31',
    company: 'Demo Agency s.r.o.', coordinator: { name: 'Peter Novák', phone: '+421 900 123 456' },
    registeredAt: '2026-06-16', lang: 'uk', permitExpiry: '2026-10-25',
  },
];
export const DEMO_SURNAMES = { 'IC23-1102': 'Kovalenko', 'NUK-0340': 'Dela Cruz', 'GAL-0201': 'Karimov', 'TARIF-2214': 'Ivanenko' };

const daysAgo = (n, h = 10) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d.toISOString(); };
const daysAhead = (n, h = 9) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return d.toISOString(); };

// Žiadosti ukážkového hosťa v IC 23 — jedna vyriešená, jedna rozpracovaná, jeden dokument.
export function demoBookingsFor(stayId) {
  if (stayId !== 'stay_demo_tarif') return [];
  const d = new Date(); const day = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return [{ id: 'b_demo_1', stayId, day, start: 18, len: 2, machine: 2, status: 'booked', createdAt: daysAgo(1, 20), demoSeeded: true }];
}
export function demoRequestsFor(stayId) {
  if (stayId !== 'stay_demo_ic23') return [];
  return [
    {
      id: 'r_demo_1', ref: 'H-1041', stayId, kind: 'issue', category: 'electric', place: 'room', room: '111/2',
      urgency: 'normal', text: 'Світло у ванній не працює.', lang: 'uk', photos: [],
      status: 'resolved', createdAt: daysAgo(5), updatedAt: daysAgo(4, 14),
      timeline: [
        { at: daysAgo(5), status: 'reported' },
        { at: daysAgo(5, 11), status: 'assigned' },
        { at: daysAgo(4, 9), status: 'inProgress', note: { sk: 'Technik príde dnes medzi 13:00 a 15:00.', en: 'The technician will come today between 13:00 and 15:00.' } },
        { at: daysAgo(4, 14), status: 'resolved', note: { sk: 'Vymenená žiarivka a štartér.', en: 'Replaced the tube light and starter.' } },
      ],
    },
    {
      id: 'r_demo_2', ref: 'H-1057', stayId, kind: 'service', service: 'laundry', bags: 1, slot: 'morning', note: '',
      status: 'assigned', createdAt: daysAgo(1, 8), updatedAt: daysAgo(1, 9),
      timeline: [
        { at: daysAgo(1, 8), status: 'reported' },
        { at: daysAgo(1, 9), status: 'assigned', note: { sk: 'Vrece sme prevzali. Hotové zajtra po 12:00 na recepcii.', en: 'We collected your bag. Ready tomorrow after 12:00 at reception.' } },
      ],
    },
    {
      id: 'r_demo_3', ref: 'H-1060', stayId, kind: 'document', purpose: 'renewal', passport: 'FE••••12', neededBy: '', pickup: 'reception',
      status: 'inProgress', createdAt: daysAgo(2, 15), updatedAt: daysAgo(1, 10),
      timeline: [
        { at: daysAgo(2, 15), status: 'reported' },
        { at: daysAgo(1, 10), status: 'inProgress', note: { sk: 'Pripravujeme, podpis konateľa v stredu.', en: 'Being prepared; signature on Wednesday.' } },
      ],
    },
  ];
}

// Oznamy. `scope: null` = celá budova. Texty: objekt podľa jazyka, chýbajúci spadne na en.
export const DEMO_ANNOUNCEMENTS = [
  {
    id: 'a_water', propertyId: 'p_ic23', severity: 'warning', validFrom: daysAgo(1), validTo: daysAhead(3, 13),
    texts: {
      en: { title: 'Water outage on Tuesday 9:00–12:00', body: 'Repair of the main pipe. Please fill a bottle in advance. Toilets on the ground floor stay open.' },
      sk: { title: 'Odstávka vody v utorok 9:00–12:00', body: 'Oprava hlavného potrubia. Naplňte si prosím vopred fľašu. Toalety na prízemí ostávajú otvorené.' },
      uk: { title: 'Відключення води у вівторок 9:00–12:00', body: 'Ремонт головної труби. Будь ласка, наберіть воду заздалегідь. Туалети на першому поверсі працюють.' },
      ru: { title: 'Отключение воды во вторник 9:00–12:00', body: 'Ремонт главной трубы. Пожалуйста, наберите воду заранее. Туалеты на первом этаже работают.' },
    },
  },
  {
    id: 'a_ddd', propertyId: 'p_ic23', severity: 'info', validFrom: daysAgo(2), validTo: daysAhead(6),
    texts: {
      en: { title: 'Pest control on the 1st floor — Thursday', body: 'Rooms 101–118 will be treated 10:00–12:00. Please put food into closed containers and leave the room during treatment.' },
      sk: { title: 'Deratizácia na 1. poschodí — štvrtok', body: 'Izby 101–118 sa ošetria 10:00–12:00. Potraviny prosím zatvorte do nádob a počas zásahu opustite izbu.' },
      uk: { title: 'Дезінсекція на 1-му поверсі — четвер', body: 'Кімнати 101–118 обробляються 10:00–12:00. Сховайте їжу в закриті контейнери та вийдіть з кімнати на час обробки.' },
      ru: { title: 'Дезинсекция на 1-м этаже — четверг', body: 'Комнаты 101–118 обрабатываются 10:00–12:00. Уберите еду в закрытые контейнеры и выйдите из комнаты на время обработки.' },
    },
  },
  {
    id: 'a_kitchen', propertyId: null, severity: 'info', validFrom: daysAgo(10), validTo: daysAhead(30),
    texts: {
      en: { title: 'Kitchen: clean up after cooking', body: 'Wash your pots, wipe the cooker and take your waste out. The kitchen is cleaned every working day, but dirty dishes are yours.' },
      sk: { title: 'Kuchyňa: po varení upracte', body: 'Umyte hrnce, utrite sporák a vyneste odpad. Kuchyňa sa upratuje každý pracovný deň, špinavý riad je však váš.' },
      uk: { title: 'Кухня: прибирайте після готування', body: 'Помийте посуд, витріть плиту та винесіть сміття. Кухню прибирають щодня в робочі дні, але брудний посуд — ваш.' },
      ru: { title: 'Кухня: убирайте после готовки', body: 'Помойте посуду, протрите плиту и вынесите мусор. Кухню убирают каждый рабочий день, но грязная посуда — ваша.' },
    },
  },
];
