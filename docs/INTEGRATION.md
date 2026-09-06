# Integration with PRIMA systems

How PRIMA SECOND HOME (guest app) connects to Casist, PRIMA RE SERVICE and PRIMA TOOLS.
This is the v1.1 plan; the v1 demo in this repository runs on the `demo` data adapter.

---

## 1. Data flows

```
Casist (PMS) ──daily report / XLSX export──▶ PRIMA TOOLS ──▶ stays (guest app DB)
                                                     │
reception prints check-in slip with code ◀───────────┘
                                                     
guest app ──request──▶ guest app DB ──bridge──▶ RE SERVICE tickets ──status──▶ guest app DB
guest app ──document request──▶ office queue (TOOLS) ──ready──▶ guest app
office (TOOLS) ──announcement──▶ guest app DB ──push──▶ guest phones
```

### 1.1 Stays from Casist

Casist has no known API. Two sources exist today:
- the **daily report e-mail** per building (already parsed by `prima-tools`,
  `src/modules/vykonnost/model.js → parseDennyReport`) — persons per company, nationality
  ranking, men/women; **no per-person rows**;
- the **monthly XLSX export** (used by the PCA generator, columns *Meno, Príchod, Odchod,
  Izba, Poznámka, Dlhodobo ubytovaný od*).

Recommended: reception creates the guest link **at check-in**, not from an import.
A small TOOLS module "Hostia" (guests) lets reception enter *building, room, surname,
client company, check-in/out* (or paste the Casist row) and prints the slip with the code.
Nightly, the XLSX/daily report reconciles check-outs (close stays whose *Odchod* passed).

### 1.2 Access code redemption

- `guest_stays` holds the stay; `guest_codes` holds a hashed code (`sha256(code)`),
  `expires_at`, `used_at`.
- Client: Supabase **anonymous sign-in** → `auth.uid()`.
- RPC `redeem_code(code text, surname_prefix text)` (security definer): validates code +
  surname prefix, links `auth.uid()` to the stay in `guest_links`, marks the code used,
  returns the stay. Rate-limited per IP/uid (edge function wrapper).
- RLS everywhere: `guest_links.uid = auth.uid()` is the only path to rows.

### 1.3 Requests → PRIMA RE SERVICE tickets

Guest issue reports are inserted into the guest DB (`guest_requests`) first (so the guest
sees them instantly), then an edge function `guest-request-bridge` (service role of the RE
SERVICE project, never in the client) creates the ticket:

```js
// shape expected by RE SERVICE (src/data/tickets-tb.js → ticketToRow, data = whole ticket)
{
  id: 'G-' + shortId,            // prefix marks guest-originated tickets
  propertyId: 'p_ic23',          // RE SERVICE property id
  room: '111/2',                 // canonical room code (see domain/room-codes.js)
  place: placeFromRoomCode('111/2'),
  category: 'Dvere',             // mapped from guest category (src/domain/ticket-bridge.js)
  forHousekeeping: false,        // true for cleanliness / linen / pests
  priority: 'Stredná',           // from urgency
  status: 'Nahlásené',
  description: '<original text>\n\n[SK] <DeepL sk>\n[EN] <DeepL en>',
  photos: [...storage paths copied to RE SERVICE bucket...],
  createdAt: ISO,
  createdBy: 'guest-app',
  source: { app: 'second-home', requestId, lang }
}
```

Status back: a DB trigger on `tickets` (RE SERVICE) calls a webhook (or the bridge polls
every 5 min like `prima-mail`) and updates `guest_requests.status` + appends a timeline
entry; staff comments flagged "visible to guest" are translated into the guest language
with the existing `translate` function pattern.

Category mapping (guest → RE SERVICE):

| Guest category | Ticket category | Housekeeping |
|---|---|---|
| walls / ceiling | Steny | no |
| door / lock | Dvere | no |
| window | Okná | no |
| floor | Podlaha | no |
| furniture / bed | Nábytok | no |
| electricity / light / socket | Elektro (EI) | no |
| water / heating / bathroom | Voda/kúrenie (ZTI) | no |
| appliance (fridge, cooker, washer) | Spotrebiče | no |
| cleanliness | Upratovanie / čistota | yes |
| linen | Bielizeň | yes |
| pests (bedbugs, cockroaches, ants) | Deratizácia → also opens DDD report | yes |
| WiFi / internet | IT | no |
| noise / behaviour | (not a ticket) → reception inbox | — |
| other | Iné | no |

### 1.4 Confirmation of accommodation

Replaces the web form on `prisluby.ubytovnaprima.sk`. Request fields: purpose (temporary
residence / renewal / other), passport number, requested validity, pickup (reception /
send to agency). Office queue in TOOLS; when issued, status → `ready`, optional PDF scan
attached (private bucket, signed URL 24 h). The legal text stays as today (stamp + signature
required; e-mail requests not processed).

### 1.5 Announcements and push

`guest_announcements` (property_id, block/floor optional, severity, valid_from/to,
texts jsonb per language). Office writes SK; DeepL fills the other languages; office can
edit. Push via `send-push` pattern (VAPID keys **separate** from RE SERVICE — different
audience, different app).

### 1.6 QR on the door

RE SERVICE door labels encode `https://service.primare.sk/?qr=IC23:111/2`. The guest app
accepts the same payload (`?qr=` → `parseQrPayload`) to pre-fill the building and room in
the report form; scanning with the phone camera opens the RE SERVICE URL, which should
redirect unauthenticated non-staff to `home.primare.sk/#/report?qr=...` (one line in
RE SERVICE `boot/deep-link.js`, guarded by "no staff session").

---

## 2. Database (guest app project)

See `supabase/migrations/20260906120000_guest_schema.sql`. Tables:

- `properties` (id, name, city, address, map_url, reception_phone, reception_email,
  messengers jsonb, arrival_tip jsonb, features jsonb)
- `house_info` (property_id, key, texts jsonb)
- `rules` (property_id nullable, version, texts jsonb)
- `guides` (id, order, texts jsonb)
- `guest_stays` (id, property_id, room, surname_prefix, client_company, coordinator jsonb,
  check_in, check_out, registered_at, lang)
- `guest_codes` (code_hash, stay_id, expires_at, used_at)
- `guest_links` (uid, stay_id, created_at)
- `guest_requests` (id, stay_id, kind issue|service|document|feedback, category, room,
  payload jsonb, photos jsonb, status, timeline jsonb, external_ref, created_at)
- `guest_announcements` (id, property_id, scope jsonb, severity, texts jsonb, valid_from,
  valid_to)
- `guest_push_subscriptions` (uid, endpoint, keys jsonb)
- `rule_acks` (uid, stay_id, version, at)

RLS: anonymous role can `select` from `properties`, `house_info`, `rules`, `guides`,
`guest_announcements` (public info). Everything with `stay_id` is readable/writable only
through `guest_links.uid = auth.uid()`.

---

## 3. Deployment

- Repo `primasecondhome_app` → Cloudflare Workers Builds, same convention as the siblings:
  `main` = production, anything else = staging (`vite.config.js` reads `WORKERS_CI_BRANCH`).
- Suggested domains: `home.primare.sk` (prod), `testing-prima-home.<account>.workers.dev`.
- Supabase project: new, separate from RE SERVICE and TOOLS (guest-facing anonymous auth
  must not share a database with staff data).

---

## 4. Office-side screens (PRIMA TOOLS, v1.1)

- **Hostia** — create stay + print slip (QR + code + first 5 languages of the building).
- **Žiadosti hostí** — inbox of service/document requests with status buttons.
- **Oznamy** — announcements editor with DeepL fill-in and preview per language.
- **Potvrdenia o ubytovaní** — queue, mark ready, attach scan.
