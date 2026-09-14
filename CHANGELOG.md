# Changelog

Verzia je v `src/config/app-config.js` (`APP_VERSION`) a v `package.json`; obe sa dvíhajú spolu.
Commit začína verziou (`v0.2.0 - …`), rovnako ako v PRIMA RE SERVICE a PRIMA TOOLS. Bez zdvihnutia
verzie sa hosťom nová verzia neponúkne.

## v0.4.1 — 14. 9. 2026 · prepínač jazyka v hlavičke

- **Jazyk sa prepína priamo v hlavičke** ako v PRIMA RE SERVICE (pilulka s aktuálnym jazykom):
  klepnutie otvorí menu 12 jazykov (názov v pôvodnom písme + kód), výber prepne jazyk okamžite —
  bez odchodu na Profil. Zatvára sa klepnutím mimo, Escape a výberom; bez vlajok (vlajka ≠ jazyk).
  Profil a uvítacia obrazovka ostávajú ako doteraz. Smoke test prepne EN ↔ UK a overí navigáciu.

## v0.4.0 — 14. 9. 2026 · kolo C (modul „Hostia“ pre TOOLS, overenie totožnosti)

- **Modul „Hostia“ pre PRIMA TOOLS** (`integrations/tools-hostia/`, drop-in s návodom): druhé
  prihlásenie do projektu hostí (office účet), karty Pobyty a kódy (zoznam po budovách, nový
  pobyt → kód → lístok A6 s QR do appky a inštrukciou v jazyku hosťa + SK/EN/UK/RU, hromadný
  import z XLSX exportu ubytovacieho systému s tlačou lístkov 2 × 2, nový kód, odhlásenie, PDF
  podpísaného poriadku, stav overenia dokladu), Žiadosti (stav + poznámka pre hosťa; poruchy len
  na čítanie s číslom ticketu RE SERVICE), Správy (vlákna, preklad, odpoveď) a Oznamy (DeepL do
  6 jazykov, plánovanie, push). Overené produkčným buildom TOOLS a Playwright harnessom s mockom
  celého projektu hostí (desktop aj mobil, bez JS chýb); logika (`genCode`, import, lístok) má
  testy v tomto repe.
- **Push pri zmene stavu žiadosti z office** (`send-push`, webhook `guest_requests` UPDATE):
  poznámka po slovensky sa preloží do jazyka hosťa a EN, doplní do časovej osi a hosť dostane
  push; poruchy preskočí (rieši `sync-ticket-status`), vlastný PATCH prekladu sa nezacyklí.
- **Overenie totožnosti (eKYC) ako krok 2 check-inu:** edge funkcie `identity-start` (JWT hosťa →
  session u poskytovateľa → presmerovanie) a `identity-webhook` (HMAC-overené rozhodnutie →
  `guest_identity` len s údajmi pre domovú knihu → push), adaptéry iDenfy a Veriff (`_shared/identity-providers.js`),
  obrazovka `/identity` (stavy pending / approved / declined / review / unavailable, „overím na
  recepcii“ ako alternatíva bez biometrie, po návrate od poskytovateľa dosync), karta Check-in
  na domove (poriadok ✓, doklad →), riadok v Dokumentoch, demo simulácia (schválenie o 4 s),
  18 nových textov v 12 jazykoch, push texty. Bez `IDENTITY_PROVIDER` appka povie „doklad
  ukážete na recepcii“.
- Welcome prijme kód aj ako `?code=` (okrem `?c=` z lístka). Verzia v0.4.0.
- Dokumentácia: `integrations/tools-hostia/README.md`, SETUP §3 (secrets a webhook eKYC, deploy
  9 funkcií) a §4 (webhook UPDATE), CHECKIN_PODPIS_OVERENIE §3, INTEGRATION §4, README.

## v0.3.0 — 14. 9. 2026 · kolo B (API: Supabase + most do RE SERVICE) a hotelový check-in

- **Backend pripravený na nasadenie** (`docs/SETUP_SUPABASE.md`): migrácia v1.1 (práčovňa, povolenia,
  podpisy, overenie totožnosti, správy s recepciou, limit pokusov o kód, office funkcie, čistenie
  a anonymizácia, privátne buckety s prístupom len k vlastnému priečinku) — overená testami nad
  PGlite vrátane RLS izolácie hostí.
- **Supabase adaptér** s rovnakým rozhraním ako demo: lokálna cache, synchronizácia zo servera,
  zápisy cez outbox (fotky do privátneho bucketu, idempotentné vklady), rezervácia práčovne
  potvrdená serverom (konflikt = obsadené), anonymné prihlásenie bez SDK. Appka prepne z DEMO
  na ostrý režim nastavením `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY`.
- **Edge funkcie**: `guest-request-bridge` (hlásenie → ticket a notifikácia v RE SERVICE, DeepL
  SK/EN, odkazy na fotky), `sync-ticket-status` (stav ticketu → stav žiadosti + push hosťovi),
  `send-push` (oznamy hosťom budovy v ich jazyku), `sign-rules` (PDF podpísaného poriadku cez
  Cloudflare Browser Rendering, e-mail cez Resend), `guest-cleanup`, `translate`. Web Push bez
  knižníc (VAPID + aes128gcm vo WebCrypto, overené proti RFC 8291).
- **Check-in v appke**: po prečítaní poriadku hosť podpíše prstom; PDF (jazyk hosťa + slovensky,
  podpis, auditný blok) vznikne hneď v telefóne a je v Dokumentoch → „Podpísané dokumenty“
  (otvoriť, zdieľať). Server doplní textové PDF a pošle kópiu e-mailom.
- **Správy s recepciou**: vlákno v jazyku hosťa (Kontakty → Napísať recepcii), diktovanie,
  odpovede recepcie s prekladom; v deme ukážková odpoveď.
- **Push na klientovi**: prepínač v profile žiada povolenie a ukladá predplatné; `sw-push.js`
  zobrazí notifikáciu a klik otvorí správnu obrazovku.
- **Office prístup** (migrácia v1.2): tabuľka `office_users` (recepcia/manažér/admin, budovy),
  politiky pre personál na pobyty, žiadosti, správy, oznamy, pravidlá; `office_create_stay` založí
  pobyt aj kód jedným volaním — základ pre modul „Hostia“ v TOOLS.
- **Upratovanie z RE SERVICE**: `sync-cleaning` (cron) plní `next_cleaning`, `last_cleaning`,
  `room_state` na pobyte; Domov ukazuje skutočný termín namiesto odhadu.
- **Správy**: webhook prekladá odpoveď recepcie do jazyka hosťa a pošle push; text hosťa sa
  prekladá do SK/EN pre recepciu.
- **Vymazať moje údaje** v profile (`guest_forget_me`): správy, notifikácie, nastavenia a väzba
  telefónu preč; hlásenia a podpísané dokumenty ostávajú do anonymizácie po odchode.
- Opravy z revízie kódu: outbox nestráca položky zaradené počas odosielania; kontrola roly cez
  `auth.role()` (nie zastaraný GUC); push Topic ≤ 32 znakov; rekurzívne mazanie fotiek pri
  anonymizácii; naplánované oznamy posiela cron; podpis prežije čistenie fotiek; lokálne PDF sa
  zahodí po serverovom; obnova tokenu naprieč oknami bez straty prihlásenia; QR nastaví budovu
  raz; otváranie PDF funguje aj v iOS Safari; jeden endpoint = jedna notifikácia.
- Nástroje: `tools/export-rules.mjs` (poriadok do tabuľky `rules`, `supabase/seed/rules.sql`),
  `.env.example`, návrh presmerovania QR pre RE SERVICE (`integrations/re-service/`).
- 57 + 12 testov (`npm run check`): DB nad PGlite, adaptér nad falošným PostgREST, handlery
  edge funkcií, parita ticket-bridge, web-push.

## v0.2.0 — 13. 9. 2026 · kolo A (klient, bez backendu)

- Diktovanie do textu hlásenia, súkromného hlásenia a poznámky k službe (Web Speech API v jazyku
  hosťa; kde API chýba, tlačidlo sa nezobrazí).
- Outbox: offline sa hlásenie uloží do telefónu a odošle sa samo po pripojení; štítok „Čaká na
  odoslanie“, pruh s počtom čakajúcich, simulácia personálu beží až od odoslania.
- QR štítok na dverách (`?qr=IC23:111/2`, formát PRIMA RE SERVICE) sa zachytí pred štartom Reactu:
  bez prihlásenia vyberie budovu, po prihlásení predvyplní izbu v hlásení (platí 30 minút).
- Ručne zadaný kód izby sa normalizuje (`b 214` → `B214`, `111 / 2` → `111/2`) a potvrdí popisom
  (bunka · izba · poschodie) podľa pravidiel RE SERVICE.
- Bezpečnostné hlavičky HSTS + Content-Security-Policy; strážca štartu presunutý z inline skriptu do
  `public/boot-watchdog.js`.
- Pätička profilu: verzia + STAGING na staging buildoch.
- `npm run check` = importy + preklady + testy + build (ako v RE SERVICE); 13 nových prekladových
  kľúčov × 12 jazykov; testy outbox, deep-link, speech a kódov izieb (29 testov).

## v0.1.0 — 6.–13. 9. 2026

- Demo appka v1–v5: prieskum, obsah TARIF, 12 jazykov, práčovňa, dokumenty, okolie, núdzová
  situácia, súkromné hlásenie; dizajn podľa Design manuálu 2026 (v5 minimal, obrysy).
