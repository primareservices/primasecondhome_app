// PRIMA TARIF — English source texts (content pack v0.1). The app translates; SK/UK/RU
// versions of rules and the emergency card are in sk.js / uk.js / ru.js, the rest falls back here.
export default {
  rules: {
    version: '1.0',
    intro: 'These rules keep the building safe and quiet for everyone. Breaking them can mean a fine or the end of your stay. Draft v1.0 for PRIMA sign-off.',
    items: [
      { title: 'Quiet hours', text: '22:00–06:00. Many neighbours work nights — keep corridors quiet at all hours.' },
      { title: 'Smoking', text: 'Only in the marked outdoor area. Never in rooms, kitchens, corridors or bathrooms.' },
      { title: 'Visitors', text: '08:00–22:00, registered at reception with ID. No overnight guests.' },
      { title: 'Your room', text: 'Cleaned on weekdays. Keep the floor clear; personal items in your locker. Cleaners do not move belongings.' },
      { title: 'Kitchen', text: 'One per floor, shared. Clean after use, label food in the fridge, never leave the hob unattended.' },
      { title: 'Alcohol', text: 'Not in common areas — kitchens, corridors, reception, entrance. Drunk behaviour: warning, then contract review.' },
      { title: 'Access card', text: 'Personal — never lend it. Lost card: tell reception at once. A replacement is charged.' },
      { title: 'Fire safety', text: 'No cooking or open flame in rooms, no covered smoke detectors, no blocked corridors. Alarm → nearest exit → assembly point.' },
      { title: 'Damage', text: 'Report at once in the app. Intentional or negligent damage is charged to the resident.' },
      { title: 'Waste', text: 'Yellow: plastics, metals, cartons · Blue: paper · Green: glass · Black: mixed. Bins at the place shown by reception.' },
      { title: 'Parking', text: 'Registered cars only, marked places only. Register your plate at reception.' },
      { title: 'Respect', text: 'Zero tolerance for violence, harassment or discrimination. Report to reception or privately in the app.' },
      { title: 'Check-out', text: 'Return key/card, room inspected, leave by the check-out time on your last day.' },
    ],
  },
  emergency: {
    title: 'Emergency',
    readToOperator: 'Read this to the operator (in Slovak):',
    assembly: 'Assembly point: parking lot',
    firstAid: 'First-aid kit: reception',
    steps: ['Alarm sounds → leave by the nearest exit', 'Go to the assembly point', 'Do not use lifts', 'Tell reception who is missing'],
  },
  facts: {
    rooms: '3-bed rooms, renovated, fridge in every room',
    laundry: 'Paid self-service laundry: 2-hour cycles, book a slot in the app.',
    cleaning: 'Rooms cleaned on weekdays; common areas daily.',
    wifi5g: 'Good 5G coverage in the building.',
    access: 'Chip card + biometric turnstile at the entrance.',
    parking: 'Private, subject to availability — register your plate at reception.',
  },
  city: {
    title: 'Around the building',
    sections: {
      transport: { title: 'Transport', items: {
        busStop: 'Bus stop “Stará Vajnorská” — lines 57 (→ Depo Jurajov dvor) and 65 (→ Vrakuňa / Rača, Tbiliská).',
        tram: 'Tram 4 from Zlaté piesky to Trnavské mýto and the centre.',
        tickets: 'Tickets from 1 Jul 2026: 30 min €1.20 paper / €1.09 in app · 60 min €1.80 / €1.60 · 24 h €5.40 / €4.85. 30-day pass €40.50, 365-day €263 — ask your employer about reimbursement.',
        fine: 'No ticket: fine €79 on the spot (€89 within 15 days, €99 after).',
      } },
      shopping: { title: 'Shopping', items: {
        mall: 'Shopping Palace Zlaté piesky — supermarket, phone shops, food court.',
        grocery: 'Groceries — Tesco Extra and Lidl at Zlaté piesky.',
        pharmacy: 'Pharmacy — Dr. Max in Shopping Palace.',
      } },
      health: { title: 'Health', items: {
        hospital: 'Hospital · urgent care — UNB Ružinov, Ružinovská 6.',
        gp: 'Your GP — you are in public insurance through your employer. Ask HR for your card, then register with a GP. Poliklinika Vajnorská (Vajnorská 40) is the nearest polyclinic.',
      } },
      money: { title: 'Money & post', items: {
        post: 'Slovenská pošta — Cesta na Senec 2A, daily 8–20. Western Union at the counter.',
        novaPost: 'Parcels to Ukraine — Nova Post №1, Dunajská 14 (city centre).',
        parcelBoxes: 'Parcel boxes — Packeta Z-BOX / AlzaBox at Shopping Palace.',
      } },
      authorities: { title: 'Authorities & support', items: {
        foreignPolice: 'Foreign police Bratislava — Račianska 62. Mon/Wed/Fri 7:30–15:30 · Tue 7:30–15:00 · Thu 7:30–14:00. Appointment required online — nothing is handled without one.',
        iom: 'IOM Migration Information Centre — Grösslingová 35 · Mon/Tue/Thu 9–12, 13–17 · 0850 211 478 · Ukrainian/Russian on Telegram +421 908 767 853 · free advice.',
        embassies: 'Embassies',
      } },
      worship: { title: 'Places of worship', items: {
        orthodox: 'Orthodox church — Chrám sv. Rastislava, Tomášikova (Ružinov). Liturgies weekdays 8:00, Sat 9:30, Sun 10:00.',
        greekCatholic: 'Greek Catholic cathedral — Ulica 29. augusta 7. Ukrainian-rite liturgies also at St. Rosalia, Lamač.',
        mosque: 'Prayer room — AYA, Bojnícka 18. Friday prayer around 13:00.',
      } },
      leisure: { title: 'Leisure', items: {
        zlatePiesky: 'Zlaté piesky lake — beach, swimming in summer, running path.',
        kuchajda: 'Kuchajda lake — park, running, football pitches.',
      } },
    },
  },
  howTo: [
    { id: 'ticket', title: 'Buy a bus ticket', steps: ['Download the IDS BK app (or Cyril) — e-tickets are cheaper: 30 min €1.09.', 'Choose 30 min for a short trip, 60 min to the centre. Activate before you board.', 'Paper ticket from the yellow machine? Validate it in the orange box on the bus.', 'Monthly pass €40.50 — ask reception for the form; your employer may reimburse it.'] },
    { id: 'doctor', title: 'Register with a doctor', steps: ['Ask your employer\'s HR for your health-insurance card (VšZP, Dôvera or Union).', 'Find a GP (“všeobecný lekár”) taking new patients — reception has a list.', 'Bring passport, residence card and insurance card; sign the registration form.', 'Urgent problem? Go to urgent care (pohotovosť) or call 155.'] },
    { id: 'money', title: 'Send money home', steps: ['Bring your passport and the receiver\'s full name.', 'Compare the app price with the counter price — apps are usually cheaper.', 'Keep the receipt until the money arrives.'] },
    { id: 'sim', title: 'Get a Slovak SIM', steps: ['Orange, Telekom, O2 or 4ka shops at Shopping Palace.', 'Bring your passport — prepaid SIMs are registered to you.', 'Top up in the operator\'s app, at machines or kiosks.'] },
    { id: 'permit', title: 'Your residence permit', steps: ['Carry your residence card and passport.', 'Renewal: apply before expiry — the app reminds you 90, 60 and 30 days ahead.', 'Address change: report to the foreign police — reception helps with the form.', 'Questions: IOM MIC gives free advice in Ukrainian and Russian.'] },
  ],
  announcementTemplates: [
    { key: 'hotWater', severity: 'warning', title: 'Hot water outage', body: 'Wednesday 10:00–14:00, boiler maintenance. Floors 1–4.' },
    { key: 'fireDrill', severity: 'urgent', title: 'Fire drill', body: 'Friday 14:00. When the alarm sounds, leave by the nearest exit and gather at the parking lot.' },
    { key: 'inspection', severity: 'info', title: 'Room inspection', body: 'Tuesday 09:00–12:00, floors 5–6. Please leave the room tidy.' },
    { key: 'cleaningChange', severity: 'info', title: 'Cleaning day change', body: 'Room cleaning on floor [X] moves from [day] to [day] this week.' },
    { key: 'shuttle', severity: 'info', title: 'Shuttle change', body: 'The [time] departure moves to [time] from [date]. Other times unchanged.' },
    { key: 'lostFound', severity: 'info', title: 'Lost & found', body: 'Found at reception: [item]. Collect with your card.' },
    { key: 'holiday', severity: 'info', title: 'Holiday hours', body: 'Reception stays 24/7. Laundry closed on [date].' },
  ],
};
