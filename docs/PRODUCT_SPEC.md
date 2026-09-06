# PRIMA SECOND HOME — product specification

Guest app for people staying in PRIMA buildings. Companion to the research in
[RESEARCH.md](RESEARCH.md); integration details in [INTEGRATION.md](INTEGRATION.md).

Status: v0.1 (MVP scaffold in this repository, demo data, no backend wired yet).

---

## 1. Vision

> The guest should never have to ask "who do I ask?" — and PRIMA should never hear about
> a problem two weeks late.

Principles (in order):
1. **Guest first, in the guest's language.** Twelve UI languages from day one; free text is
   machine-translated for staff.
2. **Zero friction.** Opens from a QR code at check-in, no app store, no e-mail, no password;
   the public part works without any login.
3. **One purpose per screen.** One dominant red action, big targets, works on a 360 px
   Android with bad WiFi; static content works offline.
4. **Same family as PRIMA RE SERVICE and PRIMA TOOLS.** Same stack, tokens, icons and
   deployment so one team maintains three apps.
5. **Minimal data.** The app knows *my* stay only; nothing about other guests; data
   disappears after check-out.
6. **Requests, not promises.** The app routes; it never decides contractual matters
   (room changes, extensions) — those go to the client's coordinator.

---

## 2. Users

### Personas

**Oleksandr, 34, Ukraine — welder at an automotive supplier, Bratislava (IC 23)**
Speaks Ukrainian, reads Russian, some English. 3-shift rota. Uses Telegram. Has been in
Slovakia 8 months, needs a new *potvrdenie o ubytovaní* for his residence renewal and
does not know reception's opening hours for it. Wants to sleep after nights; annoyed by
cleaning at 09:00.

**Dilshod, 27, Uzbekistan — warehouse operator, Galanta**
Speaks Uzbek and Russian, no Slovak, little English. First time in the EU, arrived with a
group of 20 through an agency. Does not know how the laundry works, what the WiFi password
is, or where to buy a bus ticket. Phone: mid-range Android, prepaid data.

**Maria, 41, Philippines — production operator, Trnava (Nukleon)**
Speaks Filipino and good English. Reports a broken bathroom door and cockroaches; wants to
see that someone is dealing with it. Feels uncomfortable complaining in person.

**Secondary (not app users, but recipients):**
- *Reception* — receives requests, prints access codes at check-in.
- *Housekeeping / maintenance* — see guest reports as tickets in PRIMA RE SERVICE.
- *Office* — issues confirmations of accommodation, publishes announcements.
- *Agency coordinator* — receives forwarded requests about contract matters.

### Jobs to be done

- When I arrive, I want to understand the rules and where things are, so I don't get
  into trouble.
- When something is broken or dirty, I want to report it in 30 seconds and see that it is
  being handled.
- When I need a service (laundry, extra cleaning, card), I want to order it without
  queuing at reception.
- When I need a document for the authorities, I want to request it and know when it is
  ready.
- When something is happening in the building, I want to be told in my language.
- When I have a problem I can't solve, I want one button that reaches a human.
- When I am new in Slovakia, I want to know what I must do in the first days.

---

## 3. Scope

### 3.1 MVP (v1) — what this repository implements as a working demo

| Area | Feature | Acceptance criteria |
|---|---|---|
| Onboarding | Language picker (12 languages, native names) | first screen; persisted; switchable in Profile |
| | Access code sign-in | 6–8 character code from check-in slip (+ surname check); demo codes `IC23-1102`, `NUK-0340`, `GAL-0201` |
| | Public mode | building picker → house info, rules, contacts, guides without login |
| | House rules acknowledgement | shown once after sign-in, in guest language, "I understand" stored |
| Home | My stay card | building, room, check-in/out dates, client company, next cleaning day |
| | Quick actions | Report a problem (dominant), Services, Ask reception, Documents |
| | Announcements | per building; unread badge |
| Report | New issue | category (walls, doors, windows, floor, furniture, electricity, water/heating, appliances, cleanliness, pests, noise, WiFi, other), room prefilled (editable), photo (camera/gallery, compressed client-side), description (any language), urgency; confirmation screen with reference number |
| | Issue tracking | list + detail with status timeline mirroring RE SERVICE statuses (Reported → Assigned → In progress → Longer repair / Major fault → Resolved), staff comments translated |
| Services | Catalogue | Laundry (bag drop, slot, price), Extra cleaning, Linen change, Parking, Card lost/blocked, Room/bed change (routed to coordinator), Other request |
| | Request tracking | same list/detail as issues (one "Requests" tab) |
| Documents | Confirmation of accommodation | request form (purpose, passport number, valid until), status (Requested → Being prepared → Ready at reception / Sent to agency) |
| | My registration | "Your stay was reported to the foreign police on <date>" (or "pending") |
| Info | House info | address + map link + arrival tip, reception hours, WiFi, kitchen, laundry room, quiet hours, cleaning days, waste, smoking, visitors, parking, what to do if the card fails |
| | Rules | full *ubytovací poriadok* in guest language (SK/EN full text, others fallback EN) |
| Guides | Life in Slovakia | arrival checklist, foreign police & residence, health & emergencies, money & SIM, transport, Slovak courses & help (EN/SK/UK/RU) |
| Contacts | Reach a human | reception call / WhatsApp / Viber / Telegram links, office, emergency 112/155/150/158, IOM helpline, agency coordinator (from stay) |
| Feedback | Rate & complain | 1–5 stars for cleaning/stay, free text, optional anonymous |
| Profile | Settings | language, notifications toggle (UI), privacy text, sign out |
| Platform | PWA | installable, offline shell + static content, 360 px layout, Lucide icons, PRIMA tokens |

### 3.2 v1.1 (next)
- Real backend (Supabase project `prima-home`), RLS, access-code redemption RPC.
- Bridge to PRIMA RE SERVICE tickets (both directions).
- Web push (announcements, request status changes).
- Office screens in PRIMA TOOLS: access codes at check-in, announcements editor,
  confirmations queue, request inbox.
- Room QR: scanning the existing door label (`?qr=IC23:111/2`) pre-fills the room.
- Guides in SR, RO, HU, VI, HI, NE, UZ, TL via DeepL + native review.

### 3.3 v2 (later)
- Digital access card / temporary door code via turnstile vendor API.
- Payments for guest-paid extras (card at reception or online).
- Cleaning schedule awareness ("do not disturb until 14:00" for night shift).
- Community: notice board, events, Slovak phrasebook, marketplace.
- Ratings dashboard per building for management.

### Out of scope (deliberately)
- Booking, pricing, invoices — B2B only.
- Chat between guests.
- Anything that shows other guests' identities.

---

## 4. Information architecture

Bottom navigation (mobile): **Home · Requests · Info · Profile**
Dominant action on Home: **Report a problem** (full-width red button).

```
#/                 Home (my stay, quick actions, announcements)
#/report           New issue
#/services         Services catalogue
#/services/:type   Service request form
#/requests         My requests (issues + services + documents)
#/requests/:id     Request detail + timeline
#/documents        Documents (confirmation of accommodation, registration)
#/info             House info (building)
#/info/rules       House rules
#/guides           Guides list
#/guides/:id       Guide
#/contacts         Contacts & emergency
#/feedback         Rate & complain
#/announcements    All announcements
#/profile          Settings
#/welcome          Language + sign-in (first run)
```

Hash routing is used (as in PRIMA TOOLS) so deep links survive the PWA start URL and
Cloudflare's single-page fallback.

---

## 5. Identity and onboarding

1. Reception checks the guest in (Casist) and prints/hands over the **check-in slip** with a
   QR code → `https://home.primare.sk/#/welcome?c=IC23-1102`.
2. Guest picks a language, confirms the code and enters the first 3 letters of their
   surname (cheap anti-guessing).
3. The app stores a device session (anonymous auth uid bound to the stay, v1.1); demo
   mode stores it in `localStorage`.
4. House rules are shown and acknowledged.
5. Public mode (no code): choose a building → info, rules, guides, contacts; requests
   require a code.

Codes expire at check-out + 30 days; a guest can be re-linked after a room change by
reception without a new code.

---

## 6. Languages

| Code | Language | Script note | Why |
|---|---|---|---|
| sk | Slovenčina | | staff, EU guests, official texts |
| en | English | | fallback, India, Philippines |
| uk | Українська | Cyrillic | largest group |
| ru | Русский | Cyrillic | lingua franca for UZ, KG, KZ, GE, MD, and many UA guests |
| sr | Srpski | Latin | Serbia, Bosnia, Montenegro (Croatian readers too) |
| ro | Română | | Romania, Moldova |
| hu | Magyar | | Hungary, southern Slovakia |
| vi | Tiếng Việt | | Vietnam |
| hi | हिन्दी | Devanagari | India (second-largest group) |
| ne | नेपाली | Devanagari | Nepal |
| uz | Oʻzbekcha | Latin | Uzbekistan (top nationality in at least one building) |
| tl | Filipino | | Philippines |

Fallback chain: guest language → English → Slovak. UI strings live in
`src/i18n/translations/<lang>.js` (one object per language, flat keys). Long-form content
(rules, guides, house info) lives in `src/content/` with per-language variants and the
same fallback. Free text written by the guest is sent as-is and translated server-side
(DeepL) for staff; staff replies are translated back into the guest language.

Non-SK/EN UI strings in this repository were drafted by machine and **must be reviewed by
native speakers** before production (see `docs/TRANSLATION_STATUS.md`).

---

## 7. Content model

- `properties` — id, name, city, address, map URL, reception phone/e-mail, messenger links,
  arrival tip, capacity, features.
- `house_info` — per property: WiFi, kitchen, laundry, quiet hours, cleaning days, waste,
  smoking, visitors, parking, card problems (multilingual fields).
- `rules` — per property or network default (multilingual, versioned; acknowledgement
  stores version).
- `guides` — network-wide, multilingual, markdown-like blocks.
- `announcements` — per property (optionally floor/block), multilingual, valid from/to,
  severity (info / warning / urgent).
- `requests` — one table for issues, services and documents: type, category, property,
  room, payload, photos, status, timeline, translated texts.
- `stays` — guest link: property, room, dates, client company, coordinator contact,
  registration date (foreign police), language.

---

## 8. Notifications

- In-app inbox (announcements + request updates) in v1.
- Web Push in v1.1 using the same VAPID pattern as PRIMA RE SERVICE; topics: announcements
  for my building, my request status, document ready.
- Never push marketing. Quiet hours respected (no push 22:00–07:00 except urgent).

---

## 9. Non-functional requirements

- **Performance:** first load < 200 kB JS gzipped; images compressed client-side to
  ≤ 1280 px / ~200 kB before upload.
- **Offline:** app shell, house info, rules, guides and contacts cached; requests queued
  when offline (v1.1).
- **Accessibility:** body 15 px, contrast AA, 44 px targets, no colour-only status.
- **Privacy (GDPR):** stay data minimal; photos stored in a private bucket; retention 30
  days after check-out then anonymised; no third-party analytics; consent text in the
  guest language.
- **Security:** RLS; guests read only their own rows; codes single-use for linking;
  rate limits on code redemption; no service keys in the client.

---

## 10. Architecture

- **Front-end:** Vite + React 18 (JSX), inline styles with PRIMA tokens, Lucide icons,
  `vite-plugin-pwa`, hash router (no router dependency), i18n via `useT()`.
- **Data layer:** `src/data/` behind one adapter. `demo` adapter (localStorage) ships now;
  `supabase` adapter is the next step (schema in `supabase/migrations/`).
- **Back-end (v1.1):** own Supabase project (separate from RE SERVICE for isolation);
  edge functions: `redeem-code`, `guest-request-bridge` (→ RE SERVICE ticket),
  `translate` (DeepL, same as RE SERVICE), `send-push`.
- **Deployment:** Cloudflare Workers Builds; `main` → production `home.primare.sk`,
  `testing` → staging; environment picked from `WORKERS_CI_BRANCH` like the sibling apps.

---

## 11. Success metrics (first 3 months after launch in one building)

- ≥ 60 % of new check-ins activate the app within 48 h.
- ≥ 50 % of room defects reported through the app instead of at reception.
- Median time from report to "assigned" visible to the guest < 4 h on working days.
- ≥ 30 % of confirmations of accommodation requested through the app.
- Reception phone/queue load for "WiFi / laundry / where is" questions down by half
  (reception self-report).
- Average stay rating ≥ 4.0 and complaint themes tracked per building.

---

## 12. Roadmap and effort (rough)

| Phase | Content | Effort |
|---|---|---|
| v1 demo (this repo) | all MVP screens with demo data, 12 UI languages, PWA | done |
| v1.1 backend | Supabase schema + RLS, code redemption, requests, photos, RE SERVICE bridge, TOOLS office screens, push | 4–6 weeks |
| Pilot | one building (IC 23), 5 languages on the check-in card, weekly review of requests | 4 weeks |
| Rollout | all buildings, guides translated + reviewed, agency coordinator routing | 4 weeks |
| v2 | access card, payments, shift-aware cleaning, community | later |

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| Guests don't activate the app | activation is part of check-in (code on the slip, reception shows the first screen); public mode still useful |
| Agencies object to direct contact | scope limited to building operations; contract matters routed to coordinator; agree in client contract annex |
| Translation quality in rare languages | native review before launch; DeepL for free text; EN fallback always visible |
| Reports create work nobody handles | every report becomes a RE SERVICE ticket with SLA; office inbox for documents |
| Identity abuse (someone else's code) | surname check, single-use link, reception can revoke; no personal data shown beyond room and dates |
| WiFi too poor for the app | PWA caches shell + content; mobile-data friendly payloads |
