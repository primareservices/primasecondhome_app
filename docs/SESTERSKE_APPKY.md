# Sesterské appky ako inšpirácia — PRIMA TOOLS a PRIMA RE SERVICE

Stav k 13. 9. 2026: **PRIMA TOOLS v0.52** (`tools.primare.sk`, repo `primareservices/prima-tools`) a
**PRIMA RE SERVICE v11.63** (`service.primare.sk`, repo `primareservices/prima-udrzba`). Obe sú na
GitHube a Claude k nim má prístup na čítanie; tento súbor zhŕňa, čo z nich prevziať do hosťovskej appky.

---

## 1. Čo majú spoločné a čo z toho platí pre hosťovskú appku

- **Rovnaký stack:** Vite + React 18, inline štýly (bez Tailwindu a CSS premenných), Lucide ikony,
  hash router, Supabase, Cloudflare Workers Builds (`main` = produkcia, ostatné vetvy = staging).
  Hosťovská appka to dodržiava.
- **Dizajn interných appiek:** Inter + bordová `#BD2435`, sivomodré pozadie `#F4F6F8`, rádius 12/9,
  jemný tieň, tmavý sidebar na desktope, spodná navigácia na mobile, login s izometrickou ilustráciou
  všetkých šiestich budov a prepínačom SK/EN. Hosťovská appka ide zámerne podľa **Design manuálu 2026**
  (Poppins, `#EE2A24`, biela + obrysy) — manuál je novší a appka je pre verejnosť. Otvorené
  rozhodnutie: zladiť časom aj interné appky s manuálom, alebo ich nechať (iné publikum).
- **Konvencie, ktoré sa oplatí prevziať:** verzia v každom commite (`v11.63 - …`), `CHANGELOG.md`
  s postupom vydania, `AKO-ROBIT-ZMENY.md` (tabuľka „chcem X → idem sem“), audit tagy v commitoch aj
  v komentároch (`DB-05`, `SEC-02`), `npm run check` = kontrola importov + testy + build, bezpečnostné
  hlavičky **HSTS + Content-Security-Policy** v `public/_headers`, žiadne barrel `index.js`,
  migrácie ako jediný zdroj schémy.

---

## 2. RE SERVICE — čo prevziať (podľa priority)

| # | Čo | Kde v RE SERVICE | Ako v hosťovskej appke | Náročnosť |
|---|---|---|---|---|
| 1 | **Most hlásení → tickety** | `src/data/tickets-tb.js` (`ticketToRow`), RPC `alloc_ticket_ids` (prefix `T`), politika `tickets_p_insert` vyžaduje `tickets.write` | Hosť nikdy nezapisuje priamo: serverová funkcia `guest-report` (service role alebo `SECURITY DEFINER` RPC, vzor je anonymný INSERT do `pw_resets`). Po vložení riadok v `notifications` + `send-push` rolám Admin / Property Lead / Property Manager / Vedúci údržby / Údržbár (upratovanie: Chyžná). Fotky do privátneho bucketu `ticket-photos`, v zázname len cesta. | stredná, backend |
| 2 | **Najbližšie upratovanie izby** | `clean_plan` (id `<pid>\|<YYYY-MM-DD>\|<izba>`, `plan_date` text), `cleanings` (posledné upratanie), `room_status` (stav izby) | Domov: „Najbližšie upratovanie“ zo skutočného plánu a „naposledy upratané“; čítanie cez serverovú funkciu, lebo RLS pustí len `authenticated`. | malá |
| 3 | **QR na dverách** | `?qr=IC23:111/2`, `src/qr/payload.js` (`parseQrPayload`, viazané na host), `src/boot/deep-link.js` (zachytenie pred Reactom) | Rovnaký parser; v RE SERVICE jeden riadok v `deep-link.js`: neprihláseného, kto nie je personál, presmerovať na `home.primare.sk/#/report?qr=…`. | malá |
| 4 | **Diktovanie** | `DictateButton` v `src/ui/primitives.jsx` (Web Speech API, `rec.lang`) | „Nadiktovať“ vo formulári hlásenia v jazyku hosťa — veľa hostí píše na cudzej klávesnici pomaly. | malá, len klient |
| 5 | **DeepL preklad** | edge funkcia `translate` → `{src, sk, en}`, preklad uložený na zázname (`rec.tr`, `trOf()`) | Text hosťa → SK/EN pre personál pri odoslaní; odpovede personálu → jazyk hosťa (funkciu rozšíriť o cieľový jazyk). | malá–stredná |
| 6 | **Push** | `supabase/functions/send-push`, `public/sw-push.js`, `notification_prefs`, `push_subscriptions`, `src/data/push-notify.js` | Oznamy, pripomienka práčovne, zmena stavu žiadosti; vlastné VAPID kľúče (iné publikum). | stredná |
| 7 | **Offline front zápisov** | `src/data/outbox-db.js`, `src/offline-queue.js`, `src/data/write-flags.js` (červený pruh pri zlyhaní) | Hlásenie sa nikdy nestratí (pivnica, slabé WiFi): uložiť lokálne, odoslať pri pripojení. | stredná |
| 8 | **Rozmazanie tvárí na fotkách** | `PhotoBlurEditor` (YuNet cez `onnxruntime-web`) | Súkromie spolubývajúcich na fotkách z izby. Veľký balík — až po v1.1. | stredná |
| 9 | **Kmeňové dáta izieb** | `properties`, `rooms` (`code`, `building`, `cell`, `type room\|cell_common\|common`), `src/domain/room-codes.js`, `src/domain/building.js` (`pracovna` = práčovňa) | Validácia kódu izby pri prihlásení, názvy spoločných priestorov. `placeFromRoomCode` už v appke zrkadlíme (test). | malá |
| 10 | **Kontroly izieb (Kontroly 2.0)** | `check_plans`, `check_tasks`, `inspections` | Automatický oznam hosťom „kontrola izieb dd. mm., 9:00–12:00“. | neskôr |
| 11 | **DDD (hmyz)** | `ddd_reports`, kanban podľa kola postreku | Hlásenie „hmyz“ založí DDD prípad, nie bežný ticket. | neskôr |

Poznámka: rola **Hosť** je v RE SERVICE vypnutá s komentárom (v9.24), že hosťovská časť bude
samostatná kapitola/appka — potvrdzuje zvolenú architektúru: samostatná appka + most.

---

## 3. TOOLS — čo prevziať

1. **Kódy pre hostí:** modul „Prístupy“ (`pristupy_klientov`: firma, kontakt, izba, prihlasovacie
   údaje, notifikačný e-mail, generátor hesiel, mailto šablóna) je hotový vzor pre modul **„Hostia“**
   (kód pri check-ine + tlač lístka).
2. **Pobyty z Casistu:** `src/modules/GeneratorPCA.jsx` už číta mesačný XLSX export **s riadkami po
   osobách** (Meno, Príchod, Odchod, Izba, Poznámka, Dlhodobo ubytovaný od). Z toho vieme založiť
   pobyty a kódy hromadne, nie ručne — mení to plán v `INTEGRATION.md` §1.1.
3. **Kontakty firiem:** `firmy.kontakty` (kontaktné osoby klienta) → v appke „Kontakty“ ukázať
   koordinátora agentúry hosťa.
4. **Budovy a izby:** `skupiny_prevadzok` (adresa, foto, kapacita) → `jednotky` → `poschodia` → `izby`
   (lôžka). RE SERVICE má vlastné `rooms` — treba určiť jeden zdroj pravdy (návrh: RE SERVICE pre
   izby a QR, TOOLS pre firmy a kapacity).
5. **Povolenia na pobyt:** `zamestnanci` majú `koniec_pobytu`, `VAROVANIE_DNI = 90`,
   `KRITICKE_DNI = 30` a `DOC_TYPY` → rovnaká logika ako pripomienky v appke (90 / 60 / 30); zladiť prahy.
6. **Aktualizácia bez čakania:** `version.json` + `useUpdateCheck` (každých 5 min a pri návrate do
   appky) + `lazySafe` (reload pri zastaranom chunku). Pre hostí stačí PWA `autoUpdate`, `lazySafe`
   sa oplatí.
7. **E-maily:** `email_outbox` → `mail-send` — potvrdenie „doklad je pripravený na recepcii“.

---

## 4. Čo je už zladené (netreba robiť)

Stack a build, Cloudflare/branch konvencia, Lucide, hash router, inline štýly, sémantické tokeny
`C.success/warning/info/accent` a `BRAND.*` s rovnakými názvami, `placeFromRoomCode` (test zrkadlí
RE SERVICE), `tools/verify-imports.mjs`, `_headers` (zatiaľ bez HSTS a CSP).

---

## 5. Čo ostáva na majiteľa repa

- Skopírovať brand obrázky z privátnych repozitárov (z tejto relácie sa to do verejného repa nedá):
  ```bash
  cp ../prima-tools/public/login-buildings.webp public/brand/prima-buildings.webp
  mkdir -p public/prevadzky && cp ../prima-tools/public/prevadzky/*.jpg public/prevadzky/
  node tools/crop-buildings.mjs     # výrezy po budovách pre uvítanie
  ```
- Rozhodnúť o jednej červenej pre celú rodinu appiek (manuál `#EE2A24` vs. appky `#BD2435`).
- Repo `primareservices/primahome` je len snímka tejto appky nahraná 6. 9. 2026. Ak má byť cieľové
  repo, presmerujeme naň push; inak ho možno zmazať.

---

## 6. Navrhované ďalšie kolo

- **A — hotové vo v0.2.0 (13. 9. 2026):** diktovanie v hlásení, outbox (offline front zápisov),
  verzia + STAGING v pätičke profilu, HSTS + CSP hlavičky, zachytenie `?qr=` pred Reactom,
  normalizácia a popis kódu izby podľa `room-codes`. `lazySafe` nebolo treba — appka nemá lazy
  chunky a PWA `autoUpdate` rieši zastarané súbory.
- **B — backend v1.1:** Supabase projekt hostí + adaptér, edge funkcia `guest-report` v RE SERVICE,
  čítanie `clean_plan`, DeepL, push.
- **C — TOOLS:** modul „Hostia“ (kódy z XLSX exportu, tlač lístka), koordinátori firiem do appky.
