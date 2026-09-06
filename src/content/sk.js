export default {
  arrivalTips: {
    ic15: 'Navigácie často pošlú vodičov na Ivanskú cestu 21–23. Budova je na čísle 15 — vchod s nápisom PRIMA, vedľa parkoviska.',
    ic23: 'Ivanská cesta 23 je budova za číslom 21. Recepcia je pri hlavnom vchode za turniketmi.',
    tarif: 'Stará Vajnorská 39A — vchod zo Starej Vajnorskej, bloky A, B a C majú spoločnú recepciu.',
    nukleon: 'Jána Bottu 2, Trnava — veľká budova pri zastávke Nukleón; recepcia je na prízemí.',
    nitra: 'Čajkovského 2, Nitra — asi 7 km od centra, zastávka autobusu pred budovou. Recepcia je nonstop.',
    galanta: 'Matúškovská cesta, Galanta — na ceste smerom na Matúškovo, vedľa priemyselnej zóny.',
  },
  houseInfo: {
    kitchen: 'Spoločná kuchyňa na každom poschodí so sporákmi, drezmi a mikrovlnkou. Po varení hneď upracte. Potraviny si označte; chladnička v izbe je vaša.',
    laundryRoom: 'Práčovňa: vrece s bielizňou prineste ráno na recepciu (alebo objednajte v tejto appke v Službách). Kde je samoobslužná práčovňa, recepcia vám ukáže, ako funguje.',
    quiet: 'Nočný kľud 22:00–06:00. Mnohí susedia pracujú na nočné — buďte potichu aj cez deň.',
    cleaning: 'Izby a spoločné priestory sa upratujú každý pracovný deň (pondelok–piatok). Nechajte voľnú podlahu a cennosti zamknuté. Ak spíte po nočnej, zaveste na dvere ceduľku.',
    waste: 'Trieďte odpad: plasty (žltá), papier (modrá), sklo (zelená), zmesový (čierna). Nádoby sú na každom poschodí alebo pri východe. Vrecia nenechávajte na chodbe.',
    smoking: 'V izbách a na chodbách sa nefajčí. Použite fajčiarsky priestor vonku alebo vyhradenú fajčiareň. Fajčenie v izbe je riziko požiaru a pokutuje sa.',
    visitors: 'Návštevy sú možné po kontrole dokladu na recepcii, 08:00–22:00. Prenocovanie návštev nie je dovolené. Prístupové karty majú len ubytovaní hostia.',
    parking: 'Súkromné parkovisko pre ubytovaných hostí. O miesto požiadajte na recepcii (alebo v Službách) a uveďte EČV.',
    card: 'Prístupová karta je osobná — nikdy ju nepožičiavajte. Ak neotvára turniket, príďte na recepciu s dokladom. Stratenú kartu vymení recepcia; môže byť spoplatnená.',
  },
  rules: {
    version: '2026-09',
    intro: 'Tieto pravidlá udržiavajú budovu bezpečnú a pokojnú pre všetkých. Ich porušenie môže znamenať pokutu alebo ukončenie pobytu. (Vzor podľa štandardných pravidiel PRIMA — oficiálny text je k dispozícii na recepcii.)',
    sections: [
      { title: 'Vstup a totožnosť', items: ['V budove môžu bývať len registrovaní hostia. Pri ubytovaní ukážte doklad.', 'Prístupová karta je osobná. Nepožičiavajte ju a nepúšťajte nikoho za sebou cez turniket.', 'Stratu karty ihneď nahláste na recepcii.'] },
      { title: 'Nočný kľud', items: ['22:00–06:00 je čas kľudu. Žiadna hlasná hudba, TV ani stretnutia v izbách a na chodbách.', 'Mnohí hostia spia cez deň po nočnej — hluk držte nízko vždy.'] },
      { title: 'Návštevy', items: ['Návšteva sa registruje na recepcii s dokladom a môže sa zdržať 08:00–22:00.', 'Prenocovanie návštev nie je dovolené.'] },
      { title: 'Izby', items: ['V izbách sa nefajčí, nepoužívajú sviečky, vlastné ohrievače ani variče.', 'Nepresúvajte nábytok medzi izbami a nemeňte zámky.', 'Každú závadu nahláste cez appku alebo na recepcii.', 'V pracovné dni pustite chyžné do izby; cennosti si zamknite.'] },
      { title: 'Kuchyňa a čistota', items: ['Varte len v kuchyni. Sporák a riad umyte hneď po použití.', 'Trieďte odpad a noste ho do nádob. Na chodbách sa nič neskladuje.', 'Potraviny v spoločnej chladničke označte číslom izby.'] },
      { title: 'Bezpečnosť', items: ['Nezakrývajte hlásiče dymu a neblokujte únikové východy.', 'Pri požiari opustite budovu a volajte 150 alebo 112.', 'Alkohol nie je dovolený v spoločných priestoroch. Opité alebo agresívne správanie ukončuje pobyt.'] },
      { title: 'Škody a poplatky', items: ['Škodu hneď nahláste. Úmyselné poškodenie sa účtuje.', 'Stratená karta, kľúč alebo mimoriadne upratovanie sa môžu účtovať podľa cenníka na recepcii.'] },
      { title: 'Odchod', items: ['Vráťte kartu a nechajte izbu čistú. Dátum odchodu vopred oznámte koordinátorovi a recepcii.'] },
    ],
  },
  guides: [
    {
      id: 'arrival', title: 'Prvé dni', summary: 'Kontrolný zoznam na prvý týždeň na Slovensku.',
      blocks: [
        { h: 'Hneď po príchode', list: ['Pas, doklady o pobyte a pracovnú zmluvu majte na bezpečnom mieste. Odfoťte si ich do telefónu.', 'PRIMA nahlási váš pobyt cudzineckej polícii — kvôli tomu tam nemusíte ísť.', 'Uložte si čísla na recepciu a koordinátora firmy (Kontakty v tejto appke).', 'Naučte sa pravidlá domu a nočný kľud.'] },
        { h: 'V prvom týždni', list: ['Opýtajte sa koordinátora, kedy a ako dostanete výplatu a odkiaľ príde preukaz poistenca.', 'Zaobstarajte si slovenskú SIM kartu, aby vás firma a recepcia zastihli.', 'Zistite rozpis zmien a ako sa dostanete do práce (firemný autobus, MHD).', 'Ak cestujete sami, kúpte si mesačný lístok na MHD.'] },
        { h: 'Užitočné slová', list: ['Dobrý deň', 'Ďakujem', 'Prosím', 'Recepcia', 'Izba', 'Pomoc!'] },
      ],
    },
    {
      id: 'police', title: 'Cudzinecká polícia a pobyt', summary: 'Hlásenie, povolenie na pobyt, obnovenie, zmena adresy.',
      blocks: [
        { h: 'Hlásenie pobytu', p: ['Každý cudzinec musí byť po príchode nahlásený na cudzineckej polícii — občania tretích krajín do 3 pracovných dní. Keď bývate v budove PRIMA, robí to za vás PRIMA ako ubytovateľ. Dátum vidíte v Dokumentoch.'] },
        { h: 'Potvrdenie o ubytovaní', p: ['K žiadosti o pobyt alebo jeho obnovenie potrebujete potvrdenie o ubytovaní s pečiatkou a podpisom PRIMA. Požiadajte oň v tejto appke v Dokumentoch. Kancelária potrebuje niekoľko pracovných dní. Žiadosti e-mailom sa neprijímajú.'] },
        { h: 'Obnovenie', p: ['O obnovenie požiadajte pred uplynutím platnosti pobytu — začnite 2–3 mesiace vopred. So žiadosťou zvyčajne pomáha zamestnávateľ alebo agentúra; vy dodáte potvrdenie o ubytovaní a doklady.'] },
        { h: 'Zmeny', p: ['Ak sa sťahujete do inej budovy či izby alebo odchádzate zo Slovenska natrvalo, povedzte to recepcii a koordinátorovi. Adresa v povolení na pobyt musí zodpovedať tomu, kde bývate.'] },
        { h: 'Pomoc', p: ['Migračné informačné centrum IOM poskytuje cudzincom bezplatné právne poradenstvo vo viacerých jazykoch: 0850 211 478, mic.iom.sk.'] },
      ],
    },
    {
      id: 'health', title: 'Zdravie a núdzové situácie', summary: 'Poistenie, lekári, lekárne, tiesňové čísla.',
      blocks: [
        { h: 'Tiesňové čísla', list: ['112 — tiesňové volanie (zvyčajne aj po anglicky)', '155 — záchranka', '150 — hasiči', '158 — polícia'] },
        { h: 'Zdravotné poistenie', p: ['S pracovnou zmluvou vás zamestnávateľ prihlási do verejnej zdravotnej poisťovne (VšZP, Dôvera alebo Union). Dostanete preukaz poistenca — noste ho pri sebe. Ak ho do niekoľkých týždňov nemáte, opýtajte sa koordinátora.'] },
        { h: 'Keď ste chorí', p: ['Na malé problémy choďte do lekárne — mnohé lieky sú bez predpisu. Lekára vám poradí koordinátor (ktorý všeobecný lekár prijíma pracovníkov firmy). Mimo ordinačných hodín využite pohotovosť v nemocnici.', 'Chorobu oznámte zamestnávateľovi hneď prvý deň — na platenú PN treba potvrdenie od lekára.'] },
        { h: 'V budove', p: ['Recepcia je nonstop a môže vám zavolať záchranku. Ploštice, vyrážku alebo zranenie z izby nahláste v appke okamžite.'] },
      ],
    },
    {
      id: 'money', title: 'Peniaze, banka a telefón', summary: 'Bankový účet, SIM karta, posielanie peňazí domov.',
      blocks: [
        { h: 'Bankový účet', p: ['Výplata chodí na bankový účet. Opýtajte sa koordinátora, s ktorou bankou firma spolupracuje. Na otvorenie účtu zvyčajne treba pas a doklad o pobyte; niektoré banky chcú aj potvrdenie o ubytovaní.'] },
        { h: 'SIM karta', p: ['Predplatené SIM karty (Orange, Telekom, O2, 4ka) predávajú obchody a novinové stánky; registrácia vyžaduje doklad. Dátové balíky sú lacné a hodia sa, lebo WiFi v budove býva večer vyťažené.'] },
        { h: 'Posielanie peňazí domov', p: ['Bankový prevod alebo aplikácie ako Wise, Revolut či Western Union. Porovnajte poplatky. Nikdy nikomu nedávajte kartu ani PIN.'] },
        { h: 'Výplatná páska', p: ['Máte právo na výplatnú pásku každý mesiac. Skontrolujte hodiny, príplatky za nočné a zrážky za ubytovanie. Ak niečo nesedí, opýtajte sa najprv koordinátora; sťažnosti rieši Národný inšpektorát práce.'] },
      ],
    },
    {
      id: 'transport', title: 'Doprava', summary: 'MHD, lístky, cesta do práce.',
      blocks: [
        { h: 'Do práce', p: ['Väčšina firiem má pre zmenových pracovníkov autobus — zastávku a časy vám dá koordinátor. Autobusy na nočné majú vlastný rozpis.'] },
        { h: 'Verejná doprava', p: ['Bratislava: autobusy, električky a trolejbusy (IDS BK). Lístky kúpite v appke IDS BK alebo v automatoch; papierový lístok označte vo vozidle. Pri dennom cestovaní je najlacnejší mesačník.', 'Trnava, Nitra, Galanta: mestské autobusy a regionálne vlaky (ZSSK). Lístky u vodiča, v automate alebo v appke ZSSK.'] },
        { h: 'Pravidlá', p: ['Jazda bez platného lístka stojí pokutu v desiatkach eur. Pri cestovaní majte vždy doklad.'] },
      ],
    },
    {
      id: 'help', title: 'Pomoc a slovenčina', summary: 'Bezplatné kurzy, poradenstvo, vaše práva.',
      blocks: [
        { h: 'Bezplatné kurzy slovenčiny', p: ['Migračné informačné centrum IOM organizuje bezplatné kurzy slovenčiny (A1–B2) so skupinami pre slovanských aj neslovanských hovoriacich a online materiály. Linka 0850 211 478, mic.iom.sk.'] },
        { h: 'Vaše práva v práci', p: ['Zmluvu, pracovný čas, nadčasy a zrážky za ubytovanie upravuje slovenský zákon. Odkladajte si kópie všetkého, čo podpíšete. Ak sa cítite podvedení alebo vám niekto zobral doklady, volajte národnú linku proti obchodovaniu s ľuďmi 0800 800 818 (bezplatná, dôverná).'] },
        { h: 'V budove', p: ['Recepcia hovorí slovensky a anglicky. V tejto appke píšte vo svojom jazyku — správy sa personálu prekladajú.'] },
      ],
    },
  ],
};
