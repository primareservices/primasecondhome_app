# PRIMA SECOND HOME v2 — návrh dizajnu a funkcionality (Tarif)

Dátum: 8. 9. 2026 · Vstupy: content pack TARIF v0.1 (`content/packs/tarif.md`), doplnkový rešerš
(`docs/RESEARCH-TARIF.md`), pôvodný rešerš a špecifikácia (`docs/RESEARCH.md`, `docs/PRODUCT_SPEC.md`).

**Dizajn (klikateľné plátno so 7 obrazovkami):** https://claude.ai/code/artifact/dba3de52-e581-402e-a4cd-a7808c9b6c02
Obrazovky sú nakreslené presne tokenmi appky (Inter, červená #BD2435, rádius 12/9, rovnaké karty,
riadky, tlačidlá a spodná navigácia), takže sa prenášajú do kódu 1:1 — a väčšina už v demo appke beží.

---

## 1. Čo podklad zmenil oproti v1

| Oblasť | v1 (demo z 6. 9.) | v2 (tento návrh) |
|---|---|---|
| Obsah | jeden sieťový text pre všetky budovy | **balík obsahu na budovu** (`src/content/packs/<budova>/`): fakty, poriadok, núdzová karta, sprievodca okolím, how-to karty, šablóny oznamov |
| Práčovňa | odovzdanie vreca, hotové zajtra | **rezervácia 2-hodinových okien** na konkrétnu práčku, 2,30 € (prisluby.ubytovnaprima.sk), platba na recepcii, storno do 1 h, pripomienka 30 min vopred; model v1 ostáva pre budovy bez samoobsluhy |
| Poriadok | vzorový text v 8 sekciách | **poriadok v1.0 v 13 bodoch** na podpis, per budova; hosť potvrdzuje verziu |
| Núdzové kontakty | čísla v Kontaktoch | **Núdzová karta**: čísla na jeden ťuk, adresa pre operátora po slovensky s doplnenou budovou/poschodím/izbou, kopírovať alebo prehrať nahlas, postup pri alarme, zhromaždisko, lekárnička; funguje offline |
| Sprievodcovia | 6 všeobecných sprievodcov (EN/SK/UK/RU) | + **Okolie budovy**: doprava (linky 57/65, električka 4, lístky od 1. 7. 2026, pokuta), nákupy, zdravie, peniaze a pošta, úrady (cudzinecká polícia Račianska 62 len s online rezerváciou, IOM, veľvyslanectvá), bohoslužby, voľný čas; každá položka s mapou; neoverené sa neukazuje |
| Dokumenty | potvrdenie o ubytovaní, hlásenie pobytu | + **povolenie na pobyt**: dátum platnosti, odpočet, pripomienky 90/60/30 dní, odkaz na rezervačný systém polície |
| Rešpekt (bod 12) | len spätná väzba | **Súkromné nahlásenie** vedeniu PRIMA: kategória, text, fotka, anonymne alebo s kontaktom; nikdy nie ticket údržby |
| Domov | pobyt, akcia, dlaždice, oznamy | + karta **Dnes** (najbližšia rezervácia práčovne, odpočet pobytu), dlaždica Okolie, červený riadok Núdzová situácia |
| Check-in | kód na lístku (text) | **lístok A6** s QR, kódom, izbou a vetou v 5 najčastejších jazykoch budovy — tlačí recepcia z TOOLS |
| Oznamy | ručne písané | **šablóny** z packu (odstávka teplej vody, požiarne cvičenie, kontrola izieb, zmena upratovania, zvoz, straty a nálezy, sviatky) pre kancelársky modul |

## 2. Obrazovky (podľa plátna)

1. **Domov v2** — jedna dominantná akcia (Nahlásiť problém) ostáva; nad ňou karta „Dnes" s tým, čo hosťa
   čaká (práčovňa 18:00, pobyt platí 47 dní). Núdzová situácia je na jeden ťuk, ale vizuálne pod
   akciami — nesmie súperiť s hlásením porúch.
2. **Práčovňa** — deň → okno → práčka. Šrafované = obsadené, tyrkysové = moje, červené = vybrané.
   Výber sa potvrdzuje v plávajúcom súhrne s cenou a tým, kde sa platí. Moje rezervácie so stornom.
3. **Okolie budovy** — chipy podľa kategórií; riadok = názov, popis, čas pešo, tlačidlo Mapa.
   Cudzinecká polícia má vlastnú kartu s varovaním „bez online rezervácie nevybavíte nič".
4. **Núdzová karta** — červená hlavička, štyri čísla ako veľké tlačidlá, adresa na prečítanie
   (kopírovať / prehrať), postup pri alarme, lekárnička, recepcia.
5. **Dokumenty v2** — povolenie na pobyt navrchu ako vínový hero s prstencom odpočtu (najväčšia úzkosť
   hostí), hlásenie pobytu, potvrdenie o ubytovaní so stavom, „Moje doklady" (fotky pasu a karty len
   v telefóne).
6. **Súkromné nahlásenie** — štyri kategórie, text v jazyku hosťa, fotka, anonymita zapnutá
   predvolene, kontakt voliteľný, tiesňové linky na konci.
7. **Lístok pri check-ine (A6)** — QR → `home.primare.sk/#/welcome?c=KÓD`, kód, izba, príchod,
   veta v SK/UK/RU/SR/EN (poradie podľa rebríčka národností budovy z Casist reportu).

## 3. Čo z toho už beží v demo appke

Všetko okrem tlače lístka: balíky obsahu (Tarif: fakty + poriadok/núdzová
karta v EN/SK/UK/RU, okolie a how-to v EN/SK), rezervácia práčovne, Okolie, Núdzová karta,
povolenie na pobyt s pripomienkami, súkromné nahlásenie, karta Dnes. Demo kód pre Tarif:
`TARIF-2214`, priezvisko `Ivanenko` (izba B 214, pobyt do 25. 10. 2026, rezervácia práčovne dnes 18:00).

### 3a. Dizajn v3 (8. 9. 2026)

Prvý vizuál (kópia interného vzhľadu údržbárskej appky) bol odmietnutý ako nedostatočný. Plátno má
teraz na strane 1 smer **A „Teplý a sebavedomý“** (teplá šedá, Manrope, vínový hero, bez rámikov,
plávajúca navigácia) a na strane 2 alternatívy **B „Editorial“** a **C „Bold“**. Appka je celá
prerobená na smer A — tokeny, komponenty a pravidlá sú v `docs/DESIGN_SYSTEM.md`.

## 4. Dátový model v1.1 (doplnky k `docs/INTEGRATION.md`)

- `guest_laundry_bookings` (id, stay_id, property_id, day, start_hour, len_hours, machine, status,
  created_at) — unikát (property_id, day, start_hour, machine) pre nezrušené; RLS cez `guest_links`.
- `guest_stays.permit_expiry date` — pripomienky posiela cron (push cez `send-push`) 90/60/30 dní
  vopred; hosť môže dátum zmeniť.
- `guest_requests.kind` rozšírené o `'private'`; tieto riadky číta len rola vedenia (RLS na
  `is_management`), nikdy sa neprepisujú do RE SERVICE ticketov; `anonymous = true` ukladá `stay_id = null`
  a len `property_id`.
- `property_packs` (property_id, version, facts jsonb, texts jsonb per jazyk) — zdroj je Markdown
  balík v repe (`content/packs/<budova>.md`), importér ho prevedie na JSON; office upravuje Markdown.
- `guest_announcement_templates` — šablóny z packu pre modul Oznamy v TOOLS.

## 5. Kancelárska strana (TOOLS)

- **Hostia**: založenie pobytu, tlač lístka A6 (QR + kód + jazyky budovy).
- **Oznamy**: šablóna → doplniť deň/poschodie → DeepL do 12 jazykov → publikovať; push hosťom budovy.
- **Súkromné nahlásenia**: schránka len pre vedenie, stavy Prijaté / Preverujeme / Uzavreté.
- **Práčovňa**: pohľad recepcie na dnešné rezervácie (kto má prevziať kartu práčovne), storno.
- **Balíky obsahu**: zoznam otvorených položiek (`[…]` v Markdowne) na budovu.

## 6. Otvorené položky (potrebné od PRIMA)

Z packu a rešeršu: miesto a systém práčovne, fajčiareň vs. vonkajšie miesto (primare.sk uvádza
samostatné fajčiarne), kontajnery, brána zhromaždiska, defibrilátor, poplatok za kartu, čas
odchodu, názvy potravín a lekárne, najbližší lekár prijímajúci cudzincov, bohoslužby a hodiny,
presná adresa rezervačného systému cudzineckej polície, Wi-Fi heslo (do appky len po prihlásení).

## 7. Riziká návrhu

- Rezervácia práčovne bez fyzického zámku na práčke stojí na disciplíne — preto karta práčovne
  z recepcie a pripomienka; ak sa neosvedčí, vieme prepnúť na model „vrece".
- Pripomienky k pobytu sú služba, nie právna záruka — text to hovorí a odkazuje na koordinátora.
- Súkromné nahlásenie musí mať na strane PRIMA reálneho čitateľa; bez toho je horšie ako nič.
