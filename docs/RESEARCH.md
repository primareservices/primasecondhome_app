# Who stays at PRIMA and what they need — research for the guest app

Date: 6 September 2026 · Author: product research for `primasecondhome_app`
Scope: the **people who sleep in PRIMA beds** (not the B2B clients who pay for them).

> PRIMA sells beds to companies and personnel agencies. The guest never chose PRIMA,
> never signs a contract with PRIMA and usually never pays PRIMA. Yet the guest is the
> person who lives in the building for months. Everything below is about that person.

---

## 1. Summary (what the evidence says)

1. **PRIMA houses ~3,200 beds in 6 buildings** (Bratislava ×3, Trnava, Nitra, Galanta),
   sold exclusively to companies and agencies for long-term worker accommodation.
2. **Guests are overwhelmingly foreign shift workers.** Slovakia had a record
   ~146,500 foreign workers in February 2026; Ukrainians are ~40 %, then India,
   Serbia, Uzbekistan, Vietnam, Philippines, Nepal, Georgia. PRIMA's own daily
   Casist report lists nationality ranks per building (e.g. "TOP 1 Uzbekistan: 136 beds").
3. **They work in automotive, logistics and construction around industrial zones**
   (Volkswagen Bratislava, Stellantis Trnava, Jaguar Land Rover Nitra, Samsung/logistics
   Galanta), typically on 2- or 3-shift rotas including nights — so "daytime" is
   sleep time for many, and the building never sleeps.
4. **Language is the first barrier.** Slovak is not read by most guests. Ukrainian,
   Russian (lingua franca for Uzbek/Georgian/Kyrgyz/Moldovan speakers), Serbian,
   Romanian, Hungarian, Hindi, Nepali, Vietnamese, Filipino and Uzbek cover the bulk.
   Icons-plus-text, short sentences and large touch targets matter more than features.
5. **Their most frequent pain points at PRIMA are operational and repetitive:**
   WiFi quality, cleanliness variance, pests, noise/overcrowding, a room defect that
   nobody knows about, "how do I order laundry", "where is the building" (GPS sends
   people to Ivanská 21–23 instead of 15), and how staff treat them.
6. **Their biggest anxieties are administrative:** residence registration with the
   foreign police (3 working days), the *potvrdenie o ubytovaní* they need for a
   residence permit, health insurance, a bank account, a SIM card, transport to the
   plant, and where to get help in their language. A 2026 survey found only 16 % of
   foreign workers felt the agency actually took care of them (agencies claim 33 %).
7. **PRIMA already runs the back-office systems the app needs to talk to:** Casist
   (accommodation system with daily reports), PRIMA RE SERVICE (maintenance/housekeeping
   PWA with QR codes on every room door), PRIMA TOOLS (office tools, client portal),
   turnstiles with face recognition + RFID, DeepL translation edge function, Web Push.
8. **Comparable apps for dormitory residents** (Singapore FWMOMCare, HeyBuddy,
   coliving apps, hotel guest apps) converge on the same core: house information,
   report a problem with a photo, order a service, announcements, contact staff,
   well-being/help resources — in the resident's language.
9. **Guests are on cheap Android phones with Telegram/Viber/WhatsApp.** A PWA that
   opens from a QR code at reception, needs no app store and works offline for
   static content is the right shape; push notifications are a bonus.
10. **The app must be careful with identity.** Guests have no company e-mail; their
    stay is registered by the agency. Access must come from the check-in moment
    (code on the check-in slip), and the app must not leak who lives where.

---

## 2. PRIMA today

### 2.1 Properties

| Building | City / district | Address | Beds | Notes from public sources |
|---|---|---|---|---|
| PRIMA IC 15 | Bratislava – Ružinov | Ivanská cesta 15 (16733/15), 821 04 | part of >1,900 Bratislava beds | "stable choice for longer-term accommodation of workers"; GPS often misleads drivers to Ivanská 21–23 |
| PRIMA IC 23 | Bratislava – Ružinov | Ivanská cesta 23 | 279 | double rooms after full reconstruction, shared kitchens per floor, private fridge in room |
| PRIMA Tarif | Bratislava – Nové Mesto | Stará Vajnorská 39A | — | blocks A/B/C, renovated rooms with storage, "chip-enabled biometrics, turnstiles and 24/7 reception"; reception tarif@ubytovnaprima.sk, +421 2 3310 4404 |
| PRIMA Nukleon | Trnava | Jána Bottu 2, 917 01 | 590 | daily cleaning, "superfast internet", private parking; reviews mention older building, renovation in progress, pests reported by some guests |
| PRIMA Nitra | Nitra | Čajkovského 2, 949 11 | 350 | 25 parking places, 7 km from centre, WiFi, daily cleaning; reception nr@ubytovnaprima.sk, +421 2 3310 4403; 187 reviews, mostly positive |
| PRIMA Galanta | Galanta | Matúškovská cesta | 132 | "long-term accommodation for work teams", quick access to Galanta industrial zones, Trnava and Sereď |

Total capacity quoted by PRIMA: **3,205 beds**. Office: +421 2 3310 4420 (weekdays 9–17),
office@primare.sk; accommodation-confirmation desk: office@ubytovnaprima.sk, +421 905 241 094.

### 2.2 What PRIMA promises the client (and therefore the guest)

- "Long-term accommodation exclusively for legal entities — contractors and recruitment agencies."
- "Our priority is always to accommodate employees together; we try to prevent overcrowding."
- Rooms with new floors and windows, practical furniture with storage, private fridge.
- Shared kitchen on each floor; reconstructed bathrooms.
- **Cleaning of rooms and common areas every working day.**
- Fast internet, 24/7 reception, private parking.
- **"Easy administration, fast communication and digital services including laundry
  services in the application."**
- **Access secured by facial recognition and RFID cards through turnstiles; only
  registered guests have access.**
- "Stable standard of safety and cleanliness across the network" for price-sensitive projects.

### 2.3 Systems that already exist (from the `prima-udrzba` and `prima-tools` repositories)

| System | What it is | Relevant to the guest app |
|---|---|---|
| **Casist** (`admin@primaubytovna.sk`) | accommodation/PMS system; sends a daily report per building (occupancy, persons per company, nationality TOP list, men/women, reservations, free/renovated beds); monthly XLSX export with columns *Meno, Príchod, Odchod, Izba, Poznámka, Dlhodobo ubytovaný od* | source of truth for **who is in which room and until when**; the guest app needs a per-guest link from it |
| **PRIMA RE SERVICE** (`service.primare.sk`, repo `prima-udrzba`) | maintenance + housekeeping PWA: tickets, cleaning plans, inspections, pest control (DDD), fines/reports, chat, push, QR labels on every room door (`?qr=IC23:111/2`) | guest issue reports should become tickets there; cleaning day and pest-control dates can be shown to guests; role **`Hosť` (guest) already exists** in its role list |
| **PRIMA TOOLS** (`tools.primare.sk`, repo `prima-tools`) | office tools: company directory, occupancy performance, contracts, client-portal credentials, PCA generator from Casist export, e-mail outbox (`notifikacie@primare.sk`) | office side for guest admin (access codes, confirmations of accommodation, announcements) |
| `prisluby.ubytovnaprima.sk` | web form: *žiadosť o vydanie prísľubu / potvrdenia o ubytovaní cudzinca* ("the only accepted way to request it; e-mail requests cannot be processed") plus building info pages and the Bratislava accommodation-tax ordinance | the app should absorb this form so the guest can request it in their language and track it |
| Turnstiles | face recognition + RFID card entry | lost-card / "card not working" is a predictable request type |
| DeepL edge function `translate` | translates ticket text to SK + EN | reuse for guest messages written in any language |
| Web Push (`send-push`, VAPID) | push notifications to staff PWAs | reuse for guest notifications |

Design system: inline-style tokens (`C`, `BRAND.red = #BD2435`), Inter + JetBrains Mono,
Lucide icons, no Tailwind/CSS variables, SK/EN via `t()`. Deployment: Vite build on
Cloudflare Workers Builds, `main` = production, `testing` = staging, Supabase per environment.

---

## 3. Who the guests are

### 3.1 Nationalities (national statistics, ÚPSVaR registers, February 2026)

| Group | Approx. workers in SK | Notes for the app |
|---|---|---|
| Ukraine | > 53,000 (~40 %) | Ukrainian; many also read Russian; Telegram/Viber users |
| India | > 10,000 (2nd, passed Serbia in late 2025) | Hindi/English; Punjabi, Malayalam, Tamil minorities |
| Serbia | > 6 % (~9,000) | Serbian (Latin script works for Bosnian/Montenegrin/Croatian too) |
| Uzbekistan, Vietnam, Philippines, Nepal | together > 26,000 | Uzbek + Russian; Vietnamese; Filipino/English; Nepali |
| Georgia, Kyrgyzstan, Kazakhstan, Moldova, North Macedonia, Bosnia, Turkey, Indonesia | thousands each | Russian often works for post-Soviet states; Romanian for Moldova |
| Hungary, Romania, Czechia (EU) | large EU groups | Hungarian, Romanian |

The Bratislava region alone employs ~45,000 third-country nationals and > 13,000 EU
citizens — it is the centre of foreign employment, followed by Trnava and Nitra regions.
Exactly PRIMA's footprint.

The **Casist daily report** already prints a nationality ranking per building
("TOP 1 Uzbekistan: 136 lôžok") and men/women counts — PRIMA can size the language list
per building from its own data on day one.

### 3.2 Work and daily rhythm

- Sectors: automotive assembly (Volkswagen Slovakia Bratislava, Stellantis Trnava,
  Jaguar Land Rover Nitra), logistics/warehouses, construction, food processing.
  Agency job ads quote e.g. €1,322 base + attendance bonus + €1.876/h night supplement.
- Shift patterns: 8-hour 3-shift or 12-hour 2-shift rotas, nights included; transport by
  agency bus or public transport (Volkswagen has dedicated bus lines 25/26/92 and DPB
  organises night-shift return trips).
- Consequence: **in every building, somebody is asleep at any hour**; noise, cleaning
  times and "quiet hours" are contested; guests want to know *when* cleaning comes.
- Guests arrive in groups organised by an agency coordinator; the coordinator is the
  guest's real "account manager", not PRIMA.

### 3.3 Devices and channels

- Mostly Android phones, prepaid SIMs, heavy use of Telegram (51 % of Ukrainians use it
  as primary news source), Viber and WhatsApp; Facebook groups per nationality.
- App-store installs are friction (storage, accounts); a **PWA from a QR code** at
  reception removes it. Offline access to static info matters in basements and stairwells.

### 3.4 Literacy and language

- Research on apps for low-literacy and immigrant users: icons must be accompanied by
  text, keep text minimal, larger type, simple navigation, simple login, offline access,
  audio where possible. Most European platforms lack multilingual support.
- Practical implication: every screen has one purpose, ≤ 6 primary actions, native-script
  language names, no idioms, numbers in digits.

---

## 4. What guests need — evidence

### 4.1 From reviews of PRIMA buildings (Google-aggregated review sites)

Recurring **complaints**:
- WiFi poor or unstable
- room "not really renovated" (bathroom door that does not close), smell, dirt on arrival
- cleaning not done properly / not as advertised
- bedbugs, ants, insects (Nukleon)
- overcrowded and noisy
- behaviour of some staff "negatively affected the stay"
- navigation: GPS sends people to Ivanská cesta 21–23 instead of 15

Recurring **praise**:
- daily cleaning, friendly cleaning staff, clean small rooms
- good value for money, quiet
- laundry facilities, private parking, 24/7 reception, reliable staff
- ID check-in through the employer feels safe

Reading: the product is fine when it works; the failure mode is **nobody knew** (a defect,
a dirty room, a pest sighting) or **nobody explained** (WiFi, laundry, where things are).
Both are information problems the app can fix.

### 4.2 From surveys of foreign workers in Slovakia (2026)

- "The first weeks are decisive: the employee needs to know not only what to do at the
  workplace, but where they will live, how to get to work and who to turn to when a
  problem arises." (Systémy Logistiky, July 2026)
- Gap between promise and perception: 33 % of companies say the agency provides care;
  only 16 % of workers perceive it; help with housing perceived by 22 %, integration
  support by 36 %.
- Comprehensive care should include: organised arrival, safe and affordable housing,
  transport to the workplace, onboarding training, interpreting, help with orientation,
  medical examination, bank account, and ongoing administrative support.
- IFP (Ministry of Finance) monitor, 2026: "foreigners are increasing, integration lags".

### 4.3 Legal and administrative obligations that touch the guest

| Obligation | Who | Deadline / detail | App implication |
|---|---|---|---|
| Report the foreigner's stay to the foreign police (*hlásenie pobytu*) | the accommodation facility | official form within 3 working days (third-country nationals) / the provider within 5 days; fine up to €3,300 for the provider | show the guest "your stay was registered on <date>"; collect passport data once, correctly |
| Confirmation of accommodation (*potvrdenie o ubytovaní*) | requested by the guest/agency, issued by PRIMA with stamp and signature | mandatory attachment for temporary/permanent residence applications; without it the foreign police will not issue a permit | in-app request with status; replaces the web form |
| Residence permit / national visa | guest + employer/agency | quotas raised to 10,000 national visas per year for selected countries (2024 regulation) | guide + document checklist |
| Health insurance | employer registers employee with public insurer | emergencies: 112 / 155 | guide: what to do when sick, where the nearest emergency room is |
| Accommodation tax (*daň za ubytovanie*) | paid by the facility, billed to the client | Bratislava €3.00 per person per night (€3.50 Old Town), max 60 nights per year per payer | information only |
| House rules (*ubytovací poriadok*) | facility | quiet hours typically 22:00–06:00, visitors logged 08:00–22:00 | in-app rules in the guest's language, acknowledged at onboarding |

Free help that guests rarely know about: **IOM Migration Information Centre** — free
legal, social and work counselling, free Slovak courses (A1–B2, groups for Slavic and
non-Slavic speakers), helpline 0850 211 478, Grösslingova 35 Bratislava.

### 4.4 From comparable apps

| Product | Audience | Core features | Lesson |
|---|---|---|---|
| FWMOMCare (Singapore Ministry of Manpower) | migrant workers in dormitories | 6 languages; request to speak to an officer; report unsafe practices; find clinics/tele-consult; advisories; book recreation facilities | language first; "ask for help" is a primary button; official information beats social features |
| HeyBuddy (Singapore dormitory operators) | dormitory residents | amenities and policies, communicate with management, request assistance / report issues, connect with residents, well-being resources | exactly the PRIMA problem space; still few ratings — adoption needs a push at check-in |
| Coliving resident apps (Spaceflow, Cohabs, survey data) | urban residents | maintenance requests used by 78 % of operators, announcements 75 %, events, surveys, digital keys | maintenance + announcements are the proven core; community is optional |
| Hotel/hostel guest apps (Czech: Chekin, Plazaro, Bookolo) | hotel guests | online check-in via link/QR, ID scan, digital key/PIN, requests | QR-from-reception onboarding pattern; ID capture flow |
| Lento.eu (NL) | migrant workers + employers | housing separated from employment contract, previews of housing | transparency of what you get |

### 4.5 Design constraints derived from the audience

1. Language picker is the first screen; language names in their own script.
2. Every action reachable in ≤ 2 taps from Home; one dominant red action per screen.
3. Photos over words when reporting (category icons, photo upload, optional text).
4. Text the guest writes is machine-translated for staff (DeepL already integrated).
5. Static content (rules, WiFi, contacts, guides) cached offline.
6. Never show other guests' names or rooms; the app knows only *my* stay.
7. Big type (≥ 15 px body), 44 px touch targets, high contrast; works on 360 px wide screens.

---

## 5. Implications: needs → features (prioritised)

| # | Guest need | Evidence | Feature | MVP |
|---|---|---|---|---|
| 1 | "I don't understand anything here" | §3.1, §3.4 | 12 UI languages, native-script picker, machine translation of free text | ✔ |
| 2 | "Something in my room is broken / dirty / has bugs and nobody knows" | reviews | Report a problem: category, photo, room prefilled (QR on door), status tracking, mirrors RE SERVICE ticket statuses | ✔ |
| 3 | "How do I order laundry / extra cleaning / parking / a new card?" | PRIMA promise of "laundry in the application"; reviews | Services catalogue with request forms and status | ✔ |
| 4 | "I need the confirmation of accommodation for the police" | §4.3 | Document request with status + download when issued | ✔ |
| 5 | "What is the WiFi? When is cleaning? What are the rules? Where is the kitchen?" | reviews | House info per building; rules acknowledged at onboarding | ✔ |
| 6 | "Where exactly is the building / how do I get to the plant?" | reviews, §3.2 | Address with correct map link and arrival tips; transport links | ✔ |
| 7 | "Who do I call — and in what language?" | §4.2 | Contacts: reception (call, WhatsApp/Viber/Telegram), emergency numbers, agency coordinator, IOM helpline | ✔ |
| 8 | "What happens next week (water outage, pest control, inspection)?" | RE SERVICE data (DDD, inspections) | Announcements per building/floor, push notifications | ✔ (push v1.1) |
| 9 | "Nobody listens to complaints about staff" | reviews | Feedback channel with optional anonymity; rate cleaning | ✔ (simple) |
| 10 | "First days in Slovakia are chaos" | §4.2, §4.3 | Guides: arrival checklist, police registration, health, bank, SIM, transport, Slovak courses | ✔ (EN/SK/UK/RU) |
| 11 | "My card doesn't open the turnstile" | turnstiles | Lost/blocked card request (services) | ✔ |
| 12 | "I want a different room / to extend / a roommate issue" | §3.2 | Requests routed to the agency coordinator, not decided by PRIMA | v1.1 |
| 13 | Digital access card / mobile key | turnstiles | vendor integration | v2 |
| 14 | Community: events, language exchange, marketplace | comparables | optional; only after core adoption | v2 |
| 15 | Payments for extras | — | only if guests (not clients) pay extras | v2 |

---

## 6. Open questions for PRIMA (to confirm before production)

1. **Guest identity:** can Casist export a per-guest record (name, room, dates, client
   company, nationality) daily, or only the monthly XLSX? Is there an API?
   (The app is designed around a one-time **access code handed over at check-in**.)
2. **Laundry today:** what exactly is "laundry in the application" — a self-service
   launderette app, or a drop-off service run by housekeeping? Prices, turnaround, slots?
3. **Extras and money:** which extras does the *guest* pay for personally (laundry, lost
   card, damage) vs the client company? Cash at reception or card?
4. **Turnstile vendor:** which access-control system; does it expose an API for
   "block card / issue temporary code"?
5. **House rules:** the current *ubytovací poriadok* text per building (quiet hours,
   visitors, alcohol, cooking, smoking, waste, fines).
6. **WiFi:** SSID/password per building or floor; is it stable enough to be the app's
   channel, or is mobile data the norm?
7. **Agencies:** do clients allow PRIMA to communicate directly with their workers? Some
   agencies want to be the only contact. Design assumption: informational and building
   operations yes; contractual matters (room changes, extensions, complaints about the
   employer) are routed to the agency coordinator.
8. **Languages per building:** pull the nationality ranking from Casist reports for each
   building to decide the first 5 languages printed on the check-in card.
9. **Push:** may PRIMA send notifications to guests' phones (GDPR consent text)?
10. **Legal:** data-processing basis for guest data in the app (contract with client vs
    legitimate interest), retention after check-out (proposal: 30 days, then anonymise).

---

## 7. Sources

Company and buildings
- primare.sk — "Prima – Your second home": https://primare.sk/en/ · Bratislava: https://primare.sk/bratislava · IC 15: https://primare.sk/prima-ic-15 · IC 23: https://primare.sk/prima-ic-23 · Tarif: https://primare.sk/en/prima-tarif · Nukleon: https://primare.sk/en/prima-nukleon · Galanta: https://primare.sk/prima-galanta · Nitra: https://primare.sk/prima-nitra · Contact: https://primare.sk/en/kontakt
- ubytovnaprima.sk (legacy site): https://www.ubytovnaprima.sk/en/prima-bratislava/ · Nitra: https://www.ubytovnaprima.sk/en/ubytovna/nitra/ · IC23: https://www.ubytovnaprima.sk/en/ic23/
- Services / confirmation-of-accommodation form: https://prisluby.ubytovnaprima.sk/ · https://www.ubytovnaprima.sk/klient/data/ · tax ordinance page: https://prisluby.ubytovnaprima.sk/vzn_042023/
- Facebook: https://www.facebook.com/ubytovnaprima/
- Company registers: https://finstat.sk/51082772 (PRIMA RE GROUP) · https://www.finstat.sk/47709421 (PRIMA IC, formerly UBYTOVŇA PRIMA)
- Reviews: https://slovenskobcan.com/hotel/bratislavsky/ubytovna-prima-ivanska-cesta-15/ · https://slovenskobcan.com/hotel/bratislavsky/ubytovna-prima/ · https://slovenskobcan.com/pracovna/nitriansky/ubytovna-prima/ · https://sk.revieweuro.com/trnava/ubytovna-nukleon-1467794 · https://www.cylex.sk/bratislava/ubytov%C5%88a+prima-11092135.html
- Internal repositories: `primareservices/prima-udrzba` (PRIMA RE SERVICE), `primareservices/prima-tools` (PRIMA TOOLS)

Foreign workers in Slovakia
- ÚPSVaR statistics on employment of foreigners: https://www.upsvr.gov.sk/statistiky/zamestnavanie-cudzincov-statistiky.html?page_id=10803
- ta3 (Feb 2026 record, Ukrainians lead): https://www.ta3.com/clanok/1043125/rekord-aky-tu-este-nebol-na-slovensku-pracuje-najviac-cudzincov-v-historii-pricom-ukrajinci-su-stale-na-cele-rebricka
- Startitup (146,000 foreigners): https://www.startitup.sk/na-slovensku-pracuje-rekordnych-146-000-cudzincov-firmam-stale-chyba-viac-ako-100-000-ludi/
- Pravda (more Indians than Czechs): https://ekonomika.pravda.sk/ludia/clanok/795875-pred-desiatimi-rokmi-tu-boli-traja-dnes-su-ich-tisice-na-slovensku-uz-pracuje-viac-indov-ako-cechov/
- Slovak Spectator (Indians surpass Serbs, visa quota): https://spectator.sme.sk/business/c/indian-workers-in-slovakia-numbers-surpass-serbs-as-government-expands-visa-quota
- VAIA analytics #11 (Nov 2025): https://vaia.gov.sk/sk/2025/11/vaialytics-11-zahranicni-pracovnici-pribudaju-podiel-vysokokvalifikovanych-sa-nemeni/
- IFP Monitor 16/2026 (integration lags): https://ifp.sk/trh-prace-meni-tvar-cudzinci-pribudaju-integracia-zaostava-monitor-16-2026/
- STVR (2025): https://spravy.stvr.sk/2025/07/pocet-pracujucich-cudzincov-na-slovensku-stupol-za-dva-roky-o-30-tisic-z-eu-ich-pritom-prislo-len-par-stoviek/
- OECD International Migration Outlook 2025 — Slovak Republic: https://www.oecd.org/en/publications/2025/11/international-migration-outlook-2025_355ae9fd/full-report/slovak-republic_eb8278f9.html
- EURES living and working conditions — Slovakia: https://eures.europa.eu/living-and-working/living-and-working-conditions-europe/living-and-working-conditions-slovakia_en

What workers need
- Systémy Logistiky (21 Jul 2026), "Pracovníci zo zahraničia potrebujú reálnu podporu": https://www.systemylogistiky.sk/2026/07/21/pracovnici-zo-zahranicia-potrebuju-realnu-podporu/
- Pozri.sk survey report: https://spravy.pozri.sk/clanok/slovensko-sa-bez-zahranicnych-pracovnikov-nezaobide-prieskum-ukazal-velke-rozdiely-v-podpore-po-nastupe/1611355
- Manpower Slovakia warehouse jobs (pay, shifts): https://praca.manpower.sk/praca-v-sklade/
- DPB night-shift transport for Volkswagen: https://dpb.sk/sk/zmeny-a-obmedzenia/odvoz-zamestnancov-z-rannej-zmeny-vo-volkswagen-slovakia

Legal / administrative
- Ministry of Interior — reporting of stay: http://www.minv.gov.sk/?hlasenie-pobytu-1
- Podnikajte.sk — reporting foreigners' stay (deadlines, fines): https://www.podnikajte.sk/zakonne-povinnosti-podnikatela/hlasenie-pobytu-cudzincov
- slovensko.sk — short-term stay reporting: https://www.slovensko.sk/sk/zivotne-situacie/zivotna-situacia/_hlasenie-kratkodobeho-pobytu-c/
- IOM MIC — reporting obligations: https://mic.iom.sk/sk/pobyt2/zakladne-informacie/160-ohlasovanie-pobytu-a-dolezitych-zmien-povinnosti.html · temporary residence application: https://mic.iom.sk/sk/pobyt2/prechodny-pobyt/326-ziadost-o-prechodny-pobyt-2.html · free Slovak courses: https://mic.iom.sk/sk/socialne-veci/vzdelavanie/491-otvorene-kurzy-slovenskeho-jazyka.html · services: https://iom.sk/sk/aktivity/integracia-migrantov/migracne-informacne-centrum-iom-mic.html
- Confirmation of accommodation explained: https://portalprenajmu.sk/forum/vsetko-o-povoleni-na-pobyt-pre-cudzincov · https://sro-start.sk/blog/cestne-vyhlasenie-o-poskytnuti-ubytovania-cudzincovi
- Bratislava accommodation tax: https://bratislava.sk/mesto-bratislava/dane-a-poplatky/dan-za-ubytovanie · https://www.finreport.sk/financie/bratislava-zvysuje-dan-za-ubytovanie-z-1-70-na-3-az-3-50-eura-za-noc/
- Employing foreigners 2026 procedure: https://www.aksamec.sk/zamestnavanie-cudzincov-postup-2026/

Comparable apps and design
- FWMOMCare: https://www.mom.gov.sg/eservices/fwmomcare · https://play.google.com/store/apps/details?id=sg.gov.mom.sgfwmomcare
- HeyBuddy: https://apps.apple.com/mx/app/heybuddy-community/id6450947908
- Spaceflow — what coliving residents want (2025): https://www.spaceflow.io/blog/what-coliving-residents-really-want-in-2025
- Conscious Coliving apps survey: https://www.consciouscoliving.com/coliving-apps-survey/results/
- Everything Coliving — community apps comparison: https://www.everythingcoliving.com/compare/community-apps
- Chekin — accommodation apps (CZ): https://chekin.com/cs/blog/ubytovaci-aplikace/
- Lento.eu: https://lento.eu/en
- Actionable UI design guidelines for low-literate users (ACM CSCW): https://dl.acm.org/doi/10.1145/3449210
- Messaging apps in Ukraine 2025 (Sensor Tower): https://sensortower.com/blog/2025-q2-unified-top-5-communication%20apps-units-ua-6070aae1241bc16eb81f5bab
