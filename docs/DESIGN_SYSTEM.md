# PRIMA SECOND HOME — dizajnový systém v3 („Teplý a sebavedomý", smer A)

Stav: 8. 9. 2026. Platí pre demo appku v tomto repozitári aj pre plátno
https://claude.ai/code/artifact/dba3de52-e581-402e-a4cd-a7808c9b6c02 (strana 1 = smer A,
strana 2 = alternatívy B „Editorial" a C „Bold"). Cieľ: úroveň appky z App Store, nie interný nástroj.

## 1. Princípy

1. **Jedna červená akcia na obrazovku.** Červená (`#BD2435`) je len pre hlavné tlačidlo a stav
   „vybrané". Všetko ostatné je atramentové, biele alebo tónované.
2. **Bez 1px rámikov.** Karty sa oddeľujú tieňom a tónom pozadia, nie čiarou. Vstupné polia majú
   vnútorný prstenec 1,5 px (`inset 0 0 0 1.5px rgba(23,22,26,0.08)`).
3. **Veľké čísla, veľké ciele.** Izba 56 px, 112 na 40 px, minimálna výška tlačidla 52–56 px,
   dlaždice práčky 44 px. Hostia appku používajú jednou rukou, často v rukaviciach po zmene.
4. **Tón = význam.** Tyrkysová (info, moja rezervácia), jantárová (upozornenie, pripomienka),
   zelená (hotovo), červená (núdza, vybrané), atrament (súkromné/vážne, mapa, „prehrať").
5. **Jazyk napred.** Názvy jazykov vo vlastnom písme, bez vlajok. Písma sú v builde (offline PWA).

## 2. Tokeny (`src/config/theme.js`, `src/config/app-config.js`)

| Token | Hodnota | Použitie |
|---|---|---|
| `C.bg` | `#F6F2EE` | pozadie stránky (teplá šedá) |
| `C.card` / `C.cardAlt` | `#FFFFFF` / `#F1EAE3` | karty / boxy ikon, štítky „sand" |
| `C.text` / `C.textMuted` / `C.textFaint` | `#17161A` / `#5C5860` / `#9A959C` | text / podtitulky / popisky |
| `C.navy` | `#17161A` | atramentové tlačidlá a karty (názov je historický) |
| `BRAND.red` / `redDark` / `redSoft` | `#BD2435` / `#8E1A28` / `#FBEDEF` | hlavná akcia / text v ružovom boxe / blush |
| `BRAND.wine` / `wineGradient` | `#4A0F1B` / radial+linear | hero domov, hero pobytu, aktívne chipy a dni |
| `BRAND.redGradient` | linear `#C9273A → #8E1A28` | hlavička núdzovej karty |
| `C.info*` | `#0E7C7B` / `#E3F3F1` | tyrkysová |
| `C.warning*` | `#B8721A` / `#FDF1DC` | jantárová |
| `C.success*` | `#1B8A5A` / `#E4F5EC` | zelená |
| `C.radius` / `C.radiusSm` | 22 / 16 | karty / ovládacie prvky (hero a nav 28) |
| `shadow.sm` | `0 1px 2px rgba(23,22,26,.04), 0 10px 30px rgba(23,22,26,.06)` | karty |
| `shadow.md` | `… 0 12px 34px rgba(23,22,26,.10)` | plávajúce prvky |
| `shadow.lg` | `0 22px 44px rgba(74,15,27,.28)` | vínový hero |

Písmo: **Manrope** 400–800 (latinka, cyrilika, vietnamčina) + **Noto Sans Devanagari** 400/600/700
(hindčina, nepálčina), oboje z `@fontsource` v `src/main.jsx`. Čísla používajú tabulkové číslice
(trieda `.num`), nie monospace.

Typografická škála: H1 28/800/−0,03em (hero izba 56, núdza 30), H2 sekcie 19/800/−0,02em,
titulok riadku 15/700, podtitulok 13, popisok polí 12/800 verzálky s 0,06em, štítok 12/800.

## 3. Komponenty (`src/ui/primitives.jsx`, `src/ui/GlobalStyles.jsx`)

| Komponent | Kde | Poznámka |
|---|---|---|
| `Card` (+ `className="rows"`) | všade | biela, rádius 22, tieň sm; `.rows` oddeľuje riadky 1px linkou vnútri karty |
| `IconBox` (`tone`: default/brand/info/warning/success/danger) | riadky, hlavičky | 46 px, rádius 16 |
| `ListRow` (`meta` = štítky pod podtitulom) | zoznamy | štítok stavu ide pod text, nie vpravo — text sa nezalamuje |
| `Tag` (`tone`: muted/info/warning/danger/success/ink) | stavy, „3 min", „Anonymne" | 26 px pilulka |
| `Chip` | filtre, kategórie | aktívny = vínový s tieňom |
| `QuickAction` | domov | 62 px biely box + názov pod ním, 4 v rade |
| `BigAction` | domov | jediné červené tlačidlo na domove |
| `primaryBtn` / `secondaryBtn` / `inkBtn` / `ghostBtn` / `iconBtn` | tlačidlá | 56 / 52 / 56 / 44 / 44 px |
| `Segmented` | formuláre | zvislé možnosti s rádiom, vybraná má červený vnútorný prstenec |
| `Toggle`, `Stars`, `Sheet`, `KeyValue`, `Banner`, `EmptyState`, `PageHeader` | | |
| `.pill-day`, `.m` (`.taken.hatch`, `.mine`, `.sel`, `.past`) | práčovňa | dni 56×74, práčky 44×44 |
| `.opt` / `.opt.on` | kategórie hlásení | biela karta, vybraná = červený prstenec + ružový tieň |
| `.step .n` | postup pri alarme | číslo v ružovom štvorci |
| `.bleed` | núdzová hlavička | roztiahne blok cez okraje `.page` (−20 px) |
| `.bottom-nav-inner` | navigácia | plávajúca pilulka 74 px, rádius 28, blur |

## 4. Obrazovky a ich „podpis"

- **Domov** — vínový hero (pozdrav, izba 56 px, poschodie, chipy budova/odchod/upratovanie), červené
  „Nahlásiť problém", 4 rýchle akcie, karta „Dnes" (rezervácia práčovne, pobyt, otvorené žiadosti),
  atramentový riadok Núdzová situácia, oznamy.
- **Práčovňa** — dni ako pilulky, mriežka práčok (šrafované obsadené, tyrkysová moja, červená
  vybraná), plávajúci súhrn s cenou nad navigáciou.
- **Okolie** — ilustračná mapka so špendlíkom a adresou, chipy kategórií, riadky s časom pešo a
  okrúhlym tlačidlom Mapa, cudzinecká polícia ako atramentová karta.
- **Núdzová situácia** — červená hlavička, biela karta 112, tri malé čísla, adresa po slovensky
  (kopírovať / prehrať), postup pri alarme, lekárnička.
- **Dokumenty** — vínový hero pobytu s prstencom odpočtu (posledných 180 dní) a pripomienkami
  90/60/30, riadky hlásenia a potvrdení, „Moje doklady" (fotky len v telefóne).
- **Súkromné nahlásenie** — 2×2 karty kategórií, atramentové tlačidlo (nie červené — nie je to
  bežný ticket), štítok „Anonymne" v hlavičke.
- **Vitajte** — vínová hlavička so „Welcome home." v jazyku hosťa, mriežka jazykov 2 stĺpce; kód
  ako veľký vstup s verzálkami.

## 5. Alternatívy na plátne (strana 2)

- **B „Editorial"** — Playfair Display + Manrope, krémové pozadie, tenké linky, redakčný tón. Menej
  „appkový", vhodný pre prémiovejšie budovy; horšie znáša 12 jazykov (serif bez cyriliky/dévanágarí).
- **C „Bold"** — tmavý režim, Unbounded, `#FF3B52`. Výrazný a mladý, ale v núdzovej situácii je
  tmavá obrazovka horšie čitateľná na slnku a červená stráca význam „pozor".

Odporúčanie: **A**. B/C sú na plátne ako referenčné body pre diskusiu, nie ako druhá implementácia.

## 6. Čo sa zmenilo oproti v2 (interný vzhľad údržbárskej appky)

Teplé pozadie namiesto studenej šedej, Manrope namiesto Inter/monospace, žiadne 1px rámiky,
väčšie rádiusy (22/28), plávajúca navigácia, hero s gradientom, tónované boxy ikon namiesto
sivých, jedna červená akcia na obrazovku, vlastné písma v builde (funguje offline a bez
Google Fonts).

## 7. Brand (v3.1, 8. 9. 2026) — oficiálne logo a ilustrácie

Appka používa tie isté brandové prvky ako PRIMA RE SERVICE, PRIMA TOOLS a web primare.sk:

- **Logo** `src/ui/PrimaLogo.jsx` — cesty z oficiálneho brandového SVG (strieška v dvoch červených
  `#EE2A24` / `#B82025`, slovná značka PRIMA, slogan YOUR SECOND HOME). Varianty `horizontal`
  (celé logo), `mark` (strieška + PRIMA — hlavička appky), `roof` (iba strieška — vodoznak v hero,
  ikona). Tóny `brand`, `ink` (PRIM atramentové, A červené ako na webe), `white`, `mono`.
  Oficiálne červené sú len v logu; akcie v UI ostávajú v `BRAND.red` `#BD2435` ako v celej rodine appiek.
- **Ikona PWA a favicon** — `tools/make-icons.mjs` rasterizuje bielu striešku na červenom gradiente
  (`public/icon-*.png`, `apple-touch-icon.png`, `favicon-32.png`, `favicon.svg`).
- **Ilustrácia všetkých budov** `public/brand/prima-buildings.webp` — izometrická 3D ilustrácia
  PRIMA Nitra, Tarif, Nukleon, IC 15, IC 23 a Galanta s červenou strieškou uprostred; rovnaký súbor
  ako `login-buildings.webp` na prihlásení PRIMA TOOLS / RE SERVICE. Ukazuje sa na obrazovke Vitajte
  (rozloženie ako prihlásenie: logo, ilustrácia, karta s obsahom).
- **Výrezy budov** `public/brand/buildings/<qr>.webp` — `tools/crop-buildings.mjs` ich vyreže
  z ilustrácie (súradnice v skripte). Hlavička domova hosťa je potom svetlá karta s budovou hosťa,
  Info o budove má výrez nad adresou, verejný režim tiež.
- **Náhľady prevádzok** `public/prevadzky/<qr>.jpg` — malé ilustrácie z PRIMA TOOLS pre výber
  budovy vo verejnom režime.

Všetky obrázky sú **voliteľné**: `src/ui/brand.jsx` (`useBrandImage`, `BuildingArt`, `BuildingThumb`)
najprv overí, že súbor existuje; bez neho obrazovka použije záložný vzhľad (vínový hero s vodoznakom
striešky, ikona budovy). Do repozitára ich treba skopírovať z PRIMA TOOLS (`public/login-buildings.webp`,
`public/prevadzky/*.jpg`) a spustiť `NPM_GLOBAL_ROOT=$(npm root -g) node tools/crop-buildings.mjs`.
