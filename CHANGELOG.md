# Changelog

Verzia je v `src/config/app-config.js` (`APP_VERSION`) a v `package.json`; obe sa dvíhajú spolu.
Commit začína verziou (`v0.2.0 - …`), rovnako ako v PRIMA RE SERVICE a PRIMA TOOLS. Bez zdvihnutia
verzie sa hosťom nová verzia neponúkne.

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
