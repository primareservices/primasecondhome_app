# Check-in v appke: podpis ubytovacieho poriadku a overenie totožnosti

Požiadavka z 13. 9. 2026: hosť podpíše súhlas s ubytovacím poriadkom (podpísané PDF dostane
e-mailom a vždy ho otvorí v Dokumentoch) a overí totožnosť skenom OP/pasu + selfie. Tento súbor
je podklad na rozhodnutie a návrh riešenia; nič z toho ešte nie je v kóde.

---

## 1. Podpis ubytovacieho poriadku

**Tok:** kód → (overenie totožnosti, §2) → poriadok v jazyku hosťa + slovensky → podpis prstom →
PDF → e-mail hosťovi → Dokumenty → „Podpísaný ubytovací poriadok“ (kedykoľvek otvoriteľné).

- **Podpis:** kreslený na plátne (signature pad), vložený do PDF ako obrázok. Právne ide o
  jednoduchý elektronický podpis (eIDAS SES) s auditnou stopou: čas, IP, zariadenie, ID pobytu,
  verzia poriadku, SHA-256 odtlačok PDF a výsledok overenia totožnosti. Na potvrdenie oboznámenia
  sa s poriadkom to stačí; zmluvy so zamestnávateľom (B2B) sa v appke nepodpisujú. Ak by bol
  niekedy potrebný zaručený podpis, dá sa doplniť poskytovateľ (Signi, Autenti, DocuSign) — pre
  poriadok zbytočné.
- **PDF:** HTML šablóna (SK + jazyk hosťa, logo, strieška, podpis, auditná päta) → PDF cez
  **Cloudflare Browser Rendering** (rovnaká platforma ako nasadenie; Workers Paid 5 USD/mes.,
  10 hodín renderovania v cene, ďalej 0,09 USD/h; jeden dokument trvá zlomok sekundy). Prečo nie
  pdf-lib: nezvláda tvarovanie písma pre hindčinu a nepálčinu, prehliadač áno. Záloha bez servera:
  vykreslenie na telefóne (rastrové PDF).
- **Uloženie:** privátny bucket Supabase `guest-docs/<stay>/poriadok-v<verzia>.pdf` + tabuľka
  `guest_signatures` (stay_id, version, signed_at, pdf_path, sha256, audit jsonb). Otvorenie z
  appky cez podpísaný odkaz (24 h), nikdy verejná adresa. Po odhlásení ostáva po zákonnú lehotu.
- **E-mail:** príloha PDF + krátky text v jazyku hosťa; kanál rovnaký ako v TOOLS
  (`email_outbox` → `mail-send`) alebo Resend. E-mail hosť zadá pri check-ine, je voliteľný —
  PDF ostáva v Dokumentoch aj bez neho.
- **Recepcia:** modul Hostia v TOOLS ukáže „podpísané dd. mm. rrrr“ a PDF.
- **Záloha:** doterajšie potvrdenie zaškrtnutím (`rulesAck`) ostáva pre prípad, že podpis zlyhá.

---

## 2. Overenie totožnosti (sken OP/pasu + selfie)

**Prečo:** ubytovateľ zo zákona vedie domovú knihu a hlási cudzincov; overenie, že doklad patrí
osobe, chráni pred zneužitím kódov a údaje z dokladu predvyplnia hlásenie pobytu.

**Ako:** hotový poskytovateľ (eKYC) s web SDK. Hosť odfotí doklad, spraví selfie s kontrolou
živosti; poskytovateľ porovná tvár s fotkou v doklade, overí pravosť dokladu a vráti údaje (meno,
dátum narodenia, štátna príslušnosť, číslo a platnosť dokladu, MRZ). My uložíme výsledok a údaje
potrebné pre domovú knihu; biometrické šablóny neukladáme.

| Poskytovateľ | Sídlo | Cena (orientačne, 9/2026) | Poznámka |
|---|---|---|---|
| **Innovatrics DOT** | Bratislava | na dopyt (licencia) | slovenský dodávateľ (Tatra banka, 365.bank), podpora po slovensky, možný on-prem; prvá voľba na rokovanie |
| **Veriff** | Tallinn | od 0,80 USD/overenie, plány od 49 USD/mes.; pri väčších zmluvách bežne 2–6 USD | široké pokrytie dokladov, web SDK, veľa jazykov |
| **Sumsub** | Londýn / EÚ | 1,35 USD/overenie, min. 149 USD/mes. | jazyky vrátane ukrajinčiny, ruštiny, hindčiny; 14-dňová skúška |
| **iDenfy** | Kaunas | od 1,30 USD/overenie (3 000 kreditov ročne), pri objeme 0,50–0,55 USD | platí sa len za schválené overenia; lacná EÚ voľba |
| Onfido (Entrust) | Londýn | ≈ 3 USD/overenie | drahšie, silné v UK |

Odhad pre PRIMA: pri ~3 000 nových hostí ročne 1 500 – 4 500 € ročne podľa poskytovateľa.
Pasy s MRZ podporujú všetci; ukrajinské ID karty a slovenský pobytový preukaz treba overiť v
skúške u dvoch poskytovateľov (odporúčam Innovatrics + iDenfy alebo Sumsub) na reálnych dokladoch
hostí zo šiestich hlavných národností.

**GDPR:** biometria je osobitná kategória (čl. 9) → výslovný súhlas v jazyku hosťa a alternatíva
bez biometrie (overenie na recepcii), posúdenie vplyvu (DPIA), zmluva o spracúvaní s
poskytovateľom, spracovanie v EÚ, retencia: výsledok a údaje z dokladu po dobu zákonnej povinnosti,
fotky dokladu len po odhlásenie + lehota, biometrické šablóny u poskytovateľa vymazať ihneď.
Informačná povinnosť v appke (Profil → Súkromie).

**Integrácia v našom stacku:** edge funkcia založí session u poskytovateľa (API kľúč len na
serveri) → SDK v appke (iframe alebo presmerovanie) → webhook s výsledkom → `guest_identity`
(stay_id, status, provider_ref, data jsonb, checked_at) → predvyplnenie hlásenia pobytu a domovej
knihy v TOOLS (modul Hostia).

---

## 3. Poradie

Stav 14. 9. 2026: podpis poriadku je hotový (v0.3.0: klient + edge funkcia `sign-rules`);
overenie totožnosti čaká na výber poskytovateľa.

Kolo B (backend) → kolo C (TOOLS „Hostia“) → tento check-in (podpis + overenie) ako kolo C2:
potrebuje backend, e-mail a modul Hostia. Podpisové plátno a PDF šablónu viem pripraviť už v kole B.
