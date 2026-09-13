# PRIMA SECOND HOME — dizajnový systém v4.1 (podľa PRIMA Ubytovňa Design Manual 2026, moderné prevedenie)

Stav: 13. 9. 2026. Zdroj pravdy je brand manuál (PDF od PRIMA): písmo Poppins, paleta PRIMA
červená / Carbon / Unity / Sunburst / White Fence, strieška ako grafický prvok, logo bez gradientu
a bez tieňa. Appka ho prekladá do mobilného rozhrania pre hostí v 12 jazykoch.

**v4.1 (moderné prevedenie):** verzálky ExtraBold ostávajú brandovým gestom (logo, slogan, tlač,
polepy), v appke sú nadpisy, tlačidlá a štítky vo vetách — Poppins Bold s tesným prekladom písmen.
Tlačidlá sú zaoblené bloky (rádius 16, 16 px SemiBold), sekundárne tlačidlá sú vyplnené krémom bez
rámika, vstupy tiež, štítky sú mäkké pilulky, tiene sotva viditeľné, rádius kariet 24. Je to čitateľnejšie
v 12 jazykoch (cyrilika a dévanágarí vo verzálkach strácajú rytmus) a pôsobí ako súčasná appka.

## 1. Čo z manuálu platí v appke

| Manuál | V appke |
|---|---|
| Poppins ExtraBold **výhradne verzálkami** na nadpisy a výrazné prvky | brandové gestá: logo, slogan YOUR SECOND HOME, lístok, ikona; v appke nadpisy Poppins Bold vo vetách (v4.1) |
| Poppins Regular na bežný text | text kariet, podtitulky, formuláre (400/500/600) |
| Montserrat ako sekundárne písmo | záloha pre cyriliku (uk, ru, sr) a vietnamčinu — Poppins ich nemá; dévanágarí má Poppins vlastné |
| Primárna #EE2A24 a #B82025 | akcie (#EE2A24), nadpisy a text na ružovom podklade (#B82025) |
| Unity #0C66C2 | informačný tón, moja rezervácia práčovne |
| Sunburst #F9E4B8 | upozornenia, hodnotenie hviezdičkami |
| White Fence #F8F2E4 | pozadie stránky |
| Carbon #333333 | text, tmavé karty (cudzinecká polícia), atramentové tlačidlo súkromného nahlásenia |
| Strieška z loga ako grafický prvok | akcent nad H1, pás cez kartu izby na domove (menovka dverí), vodoznak |
| Highlighter (ružový podklad, červený text) | štítky `Tag tone="danger"`: názov budovy, pripomienky, kategórie |
| Logo: červené na bielom, biele na červenej, bez gradientu | hlavička appky, Vitajte, ikona PWA (biela strieška na #EE2A24) |
| Menovky dverí „101/2 · Izba \| Room" | hero domova: pás striešky + číslo izby 64 px + „Izba \| Room" |
| Ubytovací preukaz (červený pás + logo, údaje) | karta povolenia na pobyt v Dokumentoch |
| Sivé zaoblené boxy s červeným textom | `.note` — pravidlá práčovne, pokyny |

## 2. Tokeny (`src/config/theme.js`, `src/config/app-config.js`)

| Token | Hodnota | Použitie |
|---|---|---|
| `C.bg` | `#F8F2E4` White Fence | pozadie stránky |
| `C.card` / `C.cardAlt` | `#FFFFFF` / `#F3EDE0` | karty / krémové boxy ikon |
| `C.text` / `C.textMuted` / `C.textFaint` | `#333333` / `#6A6A6A` / `#9C9C9C` | text / podtitulky / popisky |
| `C.navy` | `#333333` Carbon | tmavé karty a tlačidlá (názov kľúča je historický) |
| `BRAND.red` / `redDark` / `redSoft` | `#EE2A24` / `#B82025` / `#FBE4E2` | akcie / nadpisy / highlighter |
| `C.info*` | `#0C66C2` / `#DCE8F6` | Unity |
| `C.warning*` | `#F2B94A` / `#8A5A00` / `#F9E4B8` | Sunburst |
| `C.success*` | `#1E8E5A` / `#E3F4EA` | hotovo (manuál zelenú nemá; potrebná pre stavy) |
| `C.radius` / `C.radiusSm` | 24 / 16 | karty / vstupy; tlačidlá rádius 16, štítky a chipy pilulky |
| `shadow.sm` / `md` | mäkké sivé tiene | karty / plávajúce prvky |

Písmo: `'Poppins', 'Montserrat', system-ui` z `@fontsource` v `src/main.jsx` (400–800). Čísla
majú tabulkové číslice (`.num`). Škála: H1 28/700 (−0,02em), sekcia 18/700, titulok riadku 15/600,
text 14–15/400, popisok polí 13/600, štítok 12,5/600 v pilulke, tlačidlo 16/600, navigácia 11/600.

## 3. Komponenty (`src/ui/primitives.jsx`, `src/ui/PrimaLogo.jsx`, `src/ui/GlobalStyles.jsx`)

| Komponent | Poznámka |
|---|---|
| `PrimaLogo` (`horizontal`/`mark`/`roof`, tóny `brand`/`ink`/`white`/`mono`) | oficiálne cesty SVG; nikdy gradient ani tieň |
| `RoofBand` | pás striešky cez šírku karty (menovka dverí) |
| `RoofAccent` | malá strieška nad H1 (`PageHeader roof`) |
| `PrimaAppMark` | biela strieška na plnej červenej — rovnaká ako ikona PWA |
| `PageHeader` | strieška + H1 Bold vo vetách (Carbon) + podtitul |
| `SectionLabel` | 18/700 vo vetách, akcia vpravo |
| `primaryBtn` / `secondaryBtn` / `inkBtn` | zaoblené bloky (rádius 16), 16 px SemiBold vo vetách; červená / krémová výplň / Carbon |
| `Tag` (`danger` = highlighter, `info`, `warning`, `success`, `muted`, `ink`, `red`) | pilulka, 12,5 px SemiBold vo vetách |
| `Chip` | aktívna plná červená |
| `IconBox` (`brand`, `info`, `warning`, `success`, `danger`, `ink`, `default`) | 46 px, rádius 16 |
| `QuickAction`, `Tile`, `BigAction`, `ListRow (meta)`, `Segmented`, `Toggle`, `Sheet`, `KeyValue`, `Banner`, `EmptyState` | |
| `.pill-day`, `.m`, `.opt`, `.step .n`, `.note`, `.hatch`, `.rows/.row`, `.bleed` | triedy v `GlobalStyles.jsx` |

## 4. Obrazovky

- **Vitajte** — biela hlavička: logo, ilustrácia budov (ak je v `public/brand/`) alebo strieška,
  „VITAJTE V PRIMA / Welcome home.", mriežka jazykov (názvy vo vlastnom písme, bez vlajok).
- **Domov** — menovka dverí: pás striešky, číslo izby 64 px, „Izba | Room", štítky budova / odchod /
  upratovanie; červená pilulka „NAHLÁSIŤ PROBLÉM"; 4 rýchle akcie; „DNES"; Carbon riadok Núdza; oznamy.
- **Práčovňa** — dni ako pilulky (aktívny červený), mriežka práčok (šrafované obsadené, Unity moja,
  červená vybraná), plávajúci súhrn s cenou, pravidlá v `.note`.
- **Núdzová situácia** — plná červená hlavička, biela karta 112, tri čísla, adresa po slovensky.
- **Dokumenty** — karta pobytu ako ubytovací preukaz (červený pás + biele logo), prstenec odpočtu,
  pripomienky 90/60/30 ako highlighter štítky, „Moje doklady" len v telefóne.
- **Okolie** — krémová mapka so špendlíkom, červené chipy, Carbon karta cudzineckej polície.
- **Súkromné nahlásenie** — 2×2 karty kategórií s červeným prstencom, Carbon tlačidlo.

## 5. Pravidlá

1. Jedna červená akcia na obrazovku; ostatné sú biele alebo Carbon.
2. Verzálky len ako brandové gesto (logo, slogan, lístok). Nadpisy, tlačidlá a štítky vo vetách.
3. Žiadne gradienty a tiene na logu; plné plochy PRIMA červenej.
4. Bez 1px rámikov okolo kariet — biela karta na krémovom pozadí + mäkký tieň; vstupy majú
   vnútorný prstenec.
5. Dotykové ciele min. 44 px, čísla veľké (izba 64, 112 na 40 px).
6. Dvojjazyčný vzor z menoviek („Izba | Room") sa používa len v hero.

## 6. Brandové obrázky (voliteľné)

`src/ui/brand.jsx` overí existenciu súboru a bez neho použije záložný vzhľad:
- `public/brand/prima-buildings.webp` — izometrická ilustrácia všetkých budov (rovnaký súbor ako
  `login-buildings.webp` v PRIMA TOOLS / RE SERVICE) → Vitajte.
- `public/brand/buildings/<qr>.webp` — výrezy budov (`tools/crop-buildings.mjs`) → Info, verejný režim.
- `public/prevadzky/<qr>.jpg` — náhľady prevádzok → výber budovy vo verejnom režime.

Kopírovanie z PRIMA TOOLS do tohto verejného repozitára musí spraviť človek (bezpečnostná politika
sedenia to blokuje); potom `NPM_GLOBAL_ROOT=$(npm root -g) node tools/crop-buildings.mjs`.

## 7. Ikony PWA

`tools/make-icons.mjs` rasterizuje bielu striešku na `#EE2A24` (ikony, apple-touch-icon, favicon).
Farba témy prehliadača je `#EE2A24`.
