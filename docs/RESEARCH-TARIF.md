# PRIMA TARIF — research addendum (8 September 2026)

Complements [RESEARCH.md](RESEARCH.md) with building-specific facts for PRIMA Tarif and the
verification of open items in the content pack `content/packs/tarif.md` (PRIMA, v0.1).
primare.sk, ubytovnaprima.sk, imhd.sk, novapost.com and several other sites are blocked by
this session's egress policy, so facts below come from search-engine extracts of those pages
and from secondary sources; each item says what was verified and what still needs PRIMA.

## 1. Building facts (from the content pack, cross-checked)

| Item | Pack | Verification |
|---|---|---|
| Address | Stará Vajnorská 39/A, Nové Mesto | matches primare.sk and prisluby.ubytovnaprima.sk |
| Reception | +421 2 3310 4404, 24/7 | matches (also tarif@ubytovnaprima.sk) |
| Capacity | 1,206 beds | from primare.sk (not visible in extracts; keep) |
| Rooms | 3-bed, renovated, fridge in every room | primare.sk; note: the legacy price list offers a **fridge rental at €6.00/month**, so "fridge in every room" should be confirmed per block |
| Laundry | paid, 2-hour cycles, booked in the app | **prisluby.ubytovnaprima.sk lists laundry at €2.30 per 2 hours** — a self-service slot model, not a drop-off service |
| Wi-Fi | PRIMA-TARIF, 5G coverage | pack only; password not published (correct) |
| Access | chip card + biometric turnstile | matches primare.sk ("chip-enabled biometrics, turnstiles and 24/7 reception") |
| Cleaning | rooms on weekdays, common areas daily | primare.sk says "precise daily cleaning"; keep the pack wording |
| Smoking | marked outdoor area | primare.sk mentions **separate smoking rooms** at Tarif — confirm whether indoor smoking rooms still exist, the rule text depends on it |
| Reviews | — | Google-aggregated reviews for Tarif are positive: clean renovated rooms, daily friendly housekeeping, laundry, private parking, 24-hour reception; one guest expected more noise and was positively surprised |

## 2. Open items from the pack — what research found

| Open item | Finding | Status |
|---|---|---|
| Laundry location, price, booking | €2.30 / 2 h (legacy site). Location and the current booking tool unknown | price verified, rest PRIMA |
| Grocery ≈9 min | Tesco Extra and Lidl at Zlaté piesky; primare.sk gives walk time only | candidates, PRIMA to name |
| Pharmacy ≈8 min | Lekáreň Dr. Max in Shopping Palace | candidate |
| Tram 4 walk time | Moovit: Zlaté piesky tram stop is 383 m / 6 min from the "Stará Vajnorská" stop; from 39/A roughly 6–10 min | verify on foot |
| Bus lines | 57 (→ Depo Jurajov dvor), 65 (→ Vrakuňa / Rača, Tbiliská) at "Stará Vajnorská" | from pack (imhd.sk) |
| Tickets from 1 Jul 2026 | 30 min €1.20 paper / €1.09 app · 60 min €1.80 / €1.60 · 24 h €5.40 / €4.85 · 30-day €40.50 · 365-day €263 · fine €79 / €89 / €99 | imhd.sk page exists for 1.7.2026; numbers from the pack could not be re-read (site blocked) |
| Foreign police | Račianska 62 since 18 May 2026; **no service without an online reservation** (OCP booking system); Thu 7:30–14:00 confirmed, other days as in the pack | verified (minv.sk, Metropola) |
| IOM MIC | Grösslingová 35, 0850 211 478, UK/RU via Telegram +421 908 767 853 | verified (mic.iom.sk) |
| Embassies | Ukraine: Radvanská 35 · Serbia: Búdková 38 · Romania: Fraňa Kráľa 11 · India: Dunajská 4, 7th floor · Vietnam: Dunajská 15 | verified (embassy sites, MZV list); hours PRIMA |
| Post office | Slovenská pošta Cesta na Senec 2A (Shopping Palace area), daily 8–20; Vajnorská 100, Mon–Fri 8–18 (Wed to 19) | verified (posta.sk extracts) |
| Western Union / Ria | Western Union is available at Slovenská pošta branches (47 in Bratislava), so the Cesta na Senec 2A branch covers it | verified (posta.sk) |
| Nova Post (Ukraine parcels) | Branch №1 Dunajská 14 (centre); Nova Post also uses partner parcel boxes | verified (novapost.com); nearest box PRIMA |
| Parcel boxes | Packeta / AlzaBox at Shopping Palace | unverified |
| Hospital / urgent care | UNB Ružinov, Ružinovská 6 | address correct |
| GP taking foreigners | Poliklinika Vajnorská, Vajnorská 40 — several GPs, accepts patients from the district | candidate; language and capacity PRIMA |
| Orthodox church | Chrám sv. Rastislava, Tomášikova (Ružinov); liturgies weekdays 8:00, Sat 9:30, Sun 10:00 | verified (pravoslavni.sk extracts); house number PRIMA |
| Greek Catholic (Ukrainian rite) | Cathedral Ulica 29. augusta 7 (Ondrejský cintorín); Ukrainian liturgies at St. Rosalia, Lamač | verified (grkatba.sk); times PRIMA |
| Prayer room / mosque | AYA prayer room, Bojnícka 18 (Nové Mesto, near Vajnorská); Islamic Foundation, K Horánskej studni 29 (Dúbravka); Friday prayer ~13:00 | secondary sources; verify times |
| Accommodation tax | €3.00 per person-night (€3.50 Old Town), max 60 nights per payer per year | verified (bratislava.sk) — information only, paid by the facility |
| Smoking area, waste bins, assembly gate, defibrillator, card fee, check-out time | — | PRIMA |

## 3. What this changes in the app

1. **Laundry is a slot booking, not a drop-off.** Two-hour cycles, €2.30, presumably a few
   machines per building. The app needs a booking calendar (day → 2-hour slots → machine),
   payment note, reminders, and a "my bookings" list. The drop-off model stays for buildings
   that run laundry through housekeeping.
2. **Content is per building.** Facts, rules, emergency card, city guide and how-to cards
   live in a content pack per building (`content/packs/<building>.md` as PRIMA writes it,
   `src/content/packs/<building>/` as the app reads it). Items PRIMA has not filled are
   hidden from guests and listed for the office.
3. **Residence-permit reminders.** The pack promises reminders 90/60/30 days before expiry:
   the guest enters the expiry date once; the app shows the countdown and (v1.1) pushes.
4. **Emergency card.** Numbers, the address to read to the operator in Slovak, the assembly
   point and first-aid location on one screen, reachable in one tap.
5. **Private report.** Rule 12 (respect) needs a channel that is not maintenance: a private
   report to management with an anonymous option.
6. **Announcement templates** feed the office side (TOOLS) so that a hot-water outage takes
   one tap to publish in all languages.

Sources: primare.sk/en/prima-tarif · prisluby.ubytovnaprima.sk/tarif · minv.sk (foreign police
move, 18 May 2026) · casopismetropola.sk · mic.iom.sk · bratislava.mfa.gov.rs · bratislava.mae.ro ·
eoibratislava.gov.in · vnembassy-bratislava.mofa.gov.vn · slovakia.mfa.gov.ua · posta.sk ·
novapost.com/sk-sk · pravoslavni.sk · grkatba.sk · muslimovia.sk · moovitapp.com · bratislava.sk ·
navstevalekara.sk (Poliklinika Vajnorská) · Google review extracts for "Ubytovňa Prima Tarif".
