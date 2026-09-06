export default {
  arrivalTips: {
    ic15: 'Navigation apps often send drivers to Ivanská cesta 21–23. The building is at number 15 — the entrance with the PRIMA sign, next to the parking lot.',
    ic23: 'Ivanská cesta 23 is the building behind number 21. Reception is at the main entrance through the turnstiles.',
    tarif: 'Stará Vajnorská 39A — entrance from Stará Vajnorská, blocks A, B and C share one reception.',
    nukleon: 'Jána Bottu 2, Trnava — the large building near the Nukleón bus stop; reception is on the ground floor.',
    nitra: 'Čajkovského 2, Nitra — about 7 km from the centre, bus stop in front of the building. Reception is open 24/7.',
    galanta: 'Matúškovská cesta, Galanta — on the road towards Matúškovo, next to the industrial zone.',
  },
  houseInfo: {
    kitchen: 'Shared kitchen on each floor with cookers, sinks and a microwave. Clean up right after cooking. Keep your food labelled; the fridge in your room is yours.',
    laundryRoom: 'Laundry service: bring your bag to reception in the morning (or order it in this app under Services). Where a self-service laundry room exists, reception will show you how it works.',
    quiet: 'Quiet hours 22:00–06:00. Many of your neighbours work night shifts — keep the volume low during the day too.',
    cleaning: 'Rooms and common areas are cleaned every working day (Monday–Friday). Please leave the floor free and valuables locked away. If you are asleep after a night shift, hang the sign on the door.',
    waste: 'Sort waste: plastics (yellow), paper (blue), glass (green), mixed (black). Bins are on each floor or at the exit. Do not leave bags in the corridor.',
    smoking: 'No smoking in rooms or corridors. Use the smoking area outside or the designated smoking room. Smoking in a room is a fire risk and is fined.',
    visitors: 'Visitors are allowed with an ID check at reception, 08:00–22:00. Overnight visitors are not allowed. Only registered guests have access cards.',
    parking: 'Private parking for registered guests. Ask reception for a spot (or request it in Services) and give your licence plate.',
    card: 'Your access card is personal — never lend it. If it does not open the turnstile, go to reception with your ID. A lost card is replaced at reception; a fee may apply.',
  },
  rules: {
    version: '2026-09',
    intro: 'These rules keep the building safe and quiet for everyone. Breaking them can lead to a fine or the end of your stay. (Template based on standard PRIMA rules — the official text is available at reception.)',
    sections: [
      { title: 'Access and identity', items: ['Only registered guests may stay in the building. Show your ID at check-in.', 'Your access card is personal. Do not lend it or let anyone in behind you at the turnstile.', 'Report a lost card immediately at reception.'] },
      { title: 'Quiet hours', items: ['22:00–06:00 is quiet time. No loud music, TV or gatherings in rooms or corridors.', 'Many guests sleep during the day after night shifts — keep noise low at all times.'] },
      { title: 'Visitors', items: ['Visitors must register at reception with an ID and may stay 08:00–22:00.', 'Overnight visitors are not allowed.'] },
      { title: 'Rooms', items: ['No smoking, candles, own heaters or hotplates in rooms.', 'Do not move furniture between rooms or change locks.', 'Report any defect through the app or at reception.', 'Let housekeeping in on working days; lock away your valuables.'] },
      { title: 'Kitchen and cleanliness', items: ['Cook only in the kitchen. Clean the cooker and your dishes right after use.', 'Sort waste and take it to the bins. Nothing may be stored in corridors.', 'Food in the shared fridge must be labelled with your room number.'] },
      { title: 'Safety', items: ['Do not cover smoke detectors or block emergency exits.', 'In case of fire, leave the building and call 150 or 112.', 'Alcohol is not allowed in common areas. Drunk or aggressive behaviour ends the stay.'] },
      { title: 'Damage and fees', items: ['Report damage immediately. Intentional damage is charged.', 'Lost card, lost key or extra cleaning may be charged according to the price list at reception.'] },
      { title: 'Check-out', items: ['Return the card and leave the room clean. Tell your coordinator and reception about the date in advance.'] },
    ],
  },
  guides: [
    {
      id: 'arrival', title: 'Your first days', summary: 'Checklist for the first week in Slovakia.',
      blocks: [
        { h: 'Right after arrival', list: ['Keep your passport, residence documents and work contract in a safe place. Take photos of them on your phone.', 'PRIMA registers your stay with the foreign police — you do not need to go there for this.', 'Save the numbers of reception and your company coordinator (Contacts in this app).', 'Learn the house rules and quiet hours.'] },
        { h: 'In the first week', list: ['Ask your coordinator when and how you will be paid and where your health insurance card will come from.', 'Get a Slovak SIM card so the company and reception can reach you.', 'Find out your shift schedule and how you get to work (company bus, public transport).', 'Buy a monthly public transport pass if you travel on your own.'] },
        { h: 'Useful words', list: ['Dobrý deň — Good day', 'Ďakujem — Thank you', 'Prosím — Please', 'Recepcia — Reception', 'Izba — Room', 'Pomoc! — Help!'] },
      ],
    },
    {
      id: 'police', title: 'Foreign police and residence', summary: 'Registration, residence permit, renewal, address changes.',
      blocks: [
        { h: 'Registration of your stay', p: ['Every foreigner must be registered with the foreign police after arrival — third-country nationals within 3 working days. When you live in a PRIMA building, PRIMA does this for you as your accommodation provider. You can see the date in Documents.'] },
        { h: 'Confirmation of accommodation', p: ['For a residence permit application or renewal you need a confirmation of accommodation with the stamp and signature of PRIMA. Request it in this app under Documents. The office needs a few working days. E-mail requests are not accepted.'] },
        { h: 'Renewal', p: ['Apply for renewal before your current permit expires — start 2–3 months ahead. Your employer or agency usually helps with the application; you provide the confirmation of accommodation and your documents.'] },
        { h: 'Changes', p: ['If you move to another building or room, or leave Slovakia for good, tell reception and your coordinator. The address in your residence permit must match where you live.'] },
        { h: 'Help', p: ['The IOM Migration Information Centre gives free legal advice to foreigners in several languages: 0850 211 478, mic.iom.sk.'] },
      ],
    },
    {
      id: 'health', title: 'Health and emergencies', summary: 'Insurance, doctors, pharmacies, emergency numbers.',
      blocks: [
        { h: 'Emergency numbers', list: ['112 — general emergency (English usually understood)', '155 — ambulance', '150 — fire brigade', '158 — police'] },
        { h: 'Health insurance', p: ['With an employment contract your employer registers you with a public health insurance company (VšZP, Dôvera or Union). You receive an insurance card — keep it with you. Ask your coordinator if you have not received it within a few weeks.'] },
        { h: 'When you are sick', p: ['For small problems go to a pharmacy (lekáreň) — many medicines are sold without a prescription. For a doctor, ask your coordinator which general practitioner accepts the company\'s workers. Outside working hours use the emergency service (pohotovosť) at the hospital.', 'Tell your employer on the first day of illness — a doctor\'s note (PN) is needed for paid sick leave.'] },
        { h: 'In the building', p: ['Reception is open 24/7 and can call an ambulance for you. If you have bedbugs, a rash or an injury from the room, report it in the app immediately.'] },
      ],
    },
    {
      id: 'money', title: 'Money, bank and phone', summary: 'Bank account, SIM card, sending money home.',
      blocks: [
        { h: 'Bank account', p: ['Salaries are paid to a bank account. Ask your coordinator which bank the company works with. To open an account you usually need your passport and residence document; some banks also ask for the confirmation of accommodation.'] },
        { h: 'SIM card', p: ['Prepaid SIM cards (Orange, Telekom, O2, 4ka) are sold in shops and newsagents; registration requires an ID. Data packages are cheap and useful because building WiFi can be busy in the evening.'] },
        { h: 'Sending money home', p: ['Bank transfer or apps such as Wise, Revolut or Western Union. Compare the fees. Never give your card or PIN to anyone.'] },
        { h: 'Payslip', p: ['You have the right to a payslip every month. Check hours, night-shift supplements and deductions for accommodation. If something is wrong, ask your coordinator first; the Labour Inspectorate (Národný inšpektorát práce) handles complaints.'] },
      ],
    },
    {
      id: 'transport', title: 'Getting around', summary: 'Public transport, tickets, getting to work.',
      blocks: [
        { h: 'To work', p: ['Most companies organise a bus for shift workers — ask your coordinator for the stop and times. Night-shift buses run on their own schedule.'] },
        { h: 'Public transport', p: ['Bratislava: buses, trams and trolleybuses (IDS BK). Buy tickets in the IDS BK app or at machines and validate paper tickets on board. A monthly pass is cheapest if you travel daily.', 'Trnava, Nitra, Galanta: city buses and regional trains (ZSSK). Tickets from the driver, machines or the ZSSK app.'] },
        { h: 'Rules', p: ['Travelling without a valid ticket costs a fine of tens of euros. Always carry an ID when travelling.'] },
      ],
    },
    {
      id: 'help', title: 'Help and Slovak language', summary: 'Free courses, counselling, your rights.',
      blocks: [
        { h: 'Free Slovak courses', p: ['The IOM Migration Information Centre runs free Slovak courses (A1–B2) with groups for Slavic and non-Slavic speakers, plus online materials. Helpline 0850 211 478, mic.iom.sk.'] },
        { h: 'Your rights at work', p: ['Your contract, working hours, overtime and accommodation deductions are regulated by Slovak law. Keep copies of everything you sign. If you feel cheated or your documents are taken from you, call the national helpline against human trafficking 0800 800 818 (free, confidential).'] },
        { h: 'In the building', p: ['Reception speaks Slovak and English. Use this app to write in your own language — messages are translated for staff.'] },
      ],
    },
  ],
};
