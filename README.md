# Web Alena Hanušová — individuální basketbalové tréninky

Statický one-pager. Čisté HTML5 + jeden CSS + dva JS soubory, žádný framework,
žádný bundler, žádný build krok. Co je v repozitáři, to se nahraje na hosting.

Na větvi `new-version` je nová verze **„Hala“** — stejné texty, nový vzhled
a pohybová vrstva (animace, parallax, datové vizualizace, 3D prvky z Blenderu).
Popis je v sekci [Verze „Hala“](#verze-hala) níže.

- **Doména:** `baskethanusova.cz`, registrovaná u Webglobe
- **Hosting:** Netlify (free tier), nasazení z Gitu
- **Google Analytics 4** se souhlasem — bez kliknutí na lištu se nenačte a neuloží žádné cookies
- Kromě GA (po souhlasu) web nenačítá nic z cizích serverů; písma jsou uložená přímo na webu

## Struktura

```
index.html                    hlavní stránka (všechny sekce)
en/                           anglická verze (index, privacy-policy, 404)
llms.txt                      shrnutí webu pro AI vyhledávače (GEO), česky i anglicky
ochrana-osobnich-udaju.html   zásady zpracování osobních údajů
404.html                      chybová stránka
sitemap.xml  robots.txt  site.webmanifest
netlify.toml                  hlavičky a cache pro Netlify
.htaccess                     totéž pro Apache — na Netlify nečinné
favicon.ico  favicon.svg  apple-touch-icon.png
assets/
  css/style.css               jediný stylopis (tokeny + všechny komponenty)
  js/main.js                  základ: mobilní menu + souhlas s analytikou
  js/hriste.js                pohybová vrstva (jen na hlavní stránce, viz „Verze Hala“)
  fonts/                      Barlow 400/500/600, Barlow Condensed 600/700
                              woff2, subsety latin + latin-ext
  img/                        původní fotky (og-image, JSON-LD), mapa.png už nepoužitá
  img/hriste/                 assety verze Hala: výřezy postavy, aréna, míč, koš
blender/                      scéna pro Blender, výřez postavy (macOS Vision), export
  icons/                      6 ikon tréninkových oblastí, WhatsApp, Instagram, obálka
  icons/media/                loga médií
```

Ikony jsou v `index.html` vložené inline jako `<symbol>` (jedna kopie, žádný extra
request). Soubory v `assets/icons/` jsou jejich zdroj — **při úpravě ikony změň obojí.**

## Co zbývá doplnit

IČO je doplněné (`07287607`). Zbytek je v kódu jako `TODO` komentáře, aby na
živém webu nesvítily hranaté závorky na návštěvníky. Najdeš je přes
`grep -rn "TODO" --include="*.html" .`:

| kde | co |
|---|---|
| `index.html`, sekce „Kde a kdy" | **pražské městské části / haly.** Původní věta „V Praze nejčastěji …" je zakomentovaná; odstavec bez ní čte plynule, takže spěch není. |
| `index.html`, „Všechny články a rozhovory" | **profilové URL** — zbl.basketball, olympijskytym.cz, Wikipedia. Zakomentovaná položka `<li>`, obnovit po ověření adres. |
| `index.html`, JSON-LD | tytéž URL do `Person.sameAs` (u JSON-LD je k tomu komentář) |
| `index.html`, sekce Reference | **tři citace klientů.** Celá sekce je v `<template>`, takže se nerenderuje ani neindexuje — tohle jsou jediné hranaté závorky, které v kódu zůstaly, a nikdo je nevidí. |

### Podklady

Hotové, nasazené ze složky `Desktop/Alena Hanušová web`:

| soubor | zdroj | poznámka |
|---|---|---|
| `img/hero.jpg` + `.webp` | `Alena Hanušová_basketbal.jpeg` | 960×1200, WebP 52 kB — LCP obrázek |
| `img/about.jpg` + `.webp` | `Alena Hanušová2.jpeg` | 840×1120, WebP 32 kB |
| `img/og-image.jpg` | vygenerováno z hero fotky | 1200×630, 60 kB |
| `icons/media/ct-sport.png` | `ČT_sport_logo.png` | průhledné PNG, 357×80 |
| `icons/media/isport.svg` | `isport-normal.svg` | vektor |
| `icons/media/ctk.png` | `ČeskéNoviny.png` | 150×22 — **jediné logo bez rezervy na retinu** |
| `icons/media/irozhlas.svg` | `Logo_iRozhlas.cz.svg` | vektor (dodaný `iROZHLAS.png` se nepoužil) |
| `icons/media/denik.svg` | `Denik-logo-RGB.svg` | vektor |
| `icons/media/cz-basketball.png` | `249ZTJ.jpg` | z CMYK do sRGB, 420×80 |
| `img/mapa.png` | `Praha + 20 km od Berouna.png` | 560×400 — **jen 1× zobrazované velikosti** |

Zbývá dodat:

- **`assets/icons/whatsapp.svg`** — oficiální SVG z WhatsApp Brand Resources.
  Po výměně soubor promítni i do `<symbol id="i-whatsapp">` v `index.html`,
  `ochrana-osobnich-udaju.html` a `404.html`.
- **Šest ikon tréninkových oblastí** v `assets/icons/` je kreslených podle popisů
  v sekci 5.6 zadání. Pokud mají odpovídat Figmě, potřebují export uzlů
  `Ikona / *` › `Icon` jako 24×24 SVG.
- **Vyšší rozlišení loga ČTK.** Dodané má 150×22 px, takže se zobrazuje 1:1 a na
  retina displejích bude jediné rozmazané — ostatní loga jsou vektory nebo se
  zmenšují. Ideálně vektor z press materiálů ČTK.

### Když měníš logo médií

- **Vektor musí mít na rootu `width` a `height`, ne jen `viewBox`.** SVG bez nich
  nemá vnitřní velikost a v mřížce s `place-items: center` se zobrazí jako 0×0 —
  tiše, bez chyby v konzoli. Takhle přišly `irozhlas.svg` i moje `ctk.svg`.
- V `index.html` uprav u daného `<img>` `width`/`height` na skutečný poměr souboru
  (kvůli rezervaci místa) a `style="--h: …"` na zobrazovanou výšku (24–34 px podle
  optické váhy loga). Zobrazovanou velikost řídí `--h`, ne `width`/`height`.
- Loga jsou v běžícím pásu **dvakrát** (druhá kopie kvůli plynulé smyčce, má
  `aria-hidden` a `tabindex="-1"`). Změnu udělej v obou kopiích.
- Rastry stačí ve dvojnásobku zobrazované velikosti, víc je zbytečná zátěž.

### Pás log

Ve verzi Hala loga běží v nekonečném pásu (na mobilu i desktopu stejně velká,
takže odpadl problém s nečitelným ČTK ve dvou řadách po třech). Při najetí myší
se pás zastaví a logo se zbarví. S omezením pohybu se pás nehýbe a loga se
zalomí do řádků na střed.

### Google Analytics 4

Měřicí ID se vyplňuje na **jednom místě** — konstanta `GA_ID` na začátku
`assets/js/main.js`:

```js
var GA_ID = 'G-G7GBSGLB71';
```

Najdeš ho v GA4 pod **Správa → Datové streamy → Web → ID měření**. Dokud tam
zůstane placeholder `G-XXXXXXXXXX`, lišta se nezobrazí a nenačte se vůbec nic —
web se chová, jako by žádná analytika neexistovala. Je to schválně, aby se dal
kód nasadit dřív, než vznikne GA4 účet.

**Jak souhlas funguje**

- Před kliknutím na „Souhlasím" **neodejde na Google jediný požadavek** a neuloží
  se žádné cookies. Ověřeno v prohlížeči, ne jen odhadem.
- Volba se pamatuje v `localStorage` pod klíčem `ah-analytika-souhlas`
  (`ano` / `ne`). Čtení i zápis jsou v `try/catch`, protože v anonymním okně
  nebo při zakázaných datech stránek `localStorage` vyhodí výjimku.
- Reklamní kategorie Consent Mode (`ad_storage`, `ad_user_data`,
  `ad_personalization`) jsou **trvale zamítnuté**. Měření návštěvnosti je
  nepotřebuje a web nemá reklamní ambice.
- Odvolat souhlas jde tlačítkem v patičce každé stránky. Bez možnosti odvolání
  by souhlas podle GDPR nebyl platný, takže to tlačítko není kosmetika.
- Lišta se vkládá na začátek `<body>`, aby na ni klávesnice narazila hned, i když
  je vizuálně dole.

**Co je potřeba nastavit v GA4**

V zásadách zpracování údajů je uvedená **doba uchování 14 měsíců**. Nastav to
v GA4 pod **Správa → Nastavení dat → Uchovávání dat**, jinak text nebude
odpovídat skutečnosti (výchozí hodnota GA4 jsou 2 měsíce).

**Kdyby analytiku bylo potřeba vypnout**, vrať do `GA_ID` placeholder. Lišta
zmizí, skript se přestane načítat a v zásadách je pak potřeba upravit sekci
„Měření návštěvnosti".

### Cache a `?v=` v odkazech

Obrázky, CSS a JS mají **hodinovou** cache s `must-revalidate`, písma **roční**
s `immutable` (jejich názvy souborů se nikdy nemění). Zvyšovat `?v=2026-09`
v HTML proto **není povinné** — každá úprava se rozšíří sama nejpozději do hodiny.

Query string tam zůstal jako páka na okamžité vynucení: když potřebuješ, aby
se změna projevila hned všem (třeba špatná fotka, kterou je nutné okamžitě
stáhnout), zvyš `?v=` u dotčených odkazů a cache se obejde.

Původně to bylo nastavené na rok bez revalidace, což je rychlejší, ale znamenalo
to, že po každé výměně obrázku se `?v=` **musí** zvýšit — jinak vracejícím se
návštěvníkům zůstane rok stará podoba a ty to nepoznáš, protože ve svém
prohlížeči novou verzi vidíš. U webu, který se mění párkrát do roka a má pár set kB,
ta ztráta výkonu nestojí za to riziko.

## Verze „Hala“

Větev `new-version`. **Texty jsou beze změny** (ověřeno strojově proti `main`),
změnil se vzhled a přibyla pohybová vrstva. Kde vizualizace potřebovala popisek,
je poskládaný jen z faktů, která už na webu jsou (časová osa kariéry, popisky na
taktické tabuli, kalkulačka).

### Koncept

Tmavá hala, papír a červená z reprezentačního dresu. Písmo zůstalo (Barlow
a Barlow Condensed, self-hostované). Prvky, které web odlišují od šablony:

| sekce | co se děje |
|---|---|
| Úvod | Alena vyříznutá z fotky stojí v kuželu reflektoru na palubovce z Blenderu. Čáry hřiště (SVG v perspektivě) se nakreslí pod ni, za ní je velké obrysové jméno, kolem trenérské poznámky křídou. Při scrollu jedou vrstvy různou rychlostí (parallax). |
| Hlavička | časomíra útoku: při scrollu odpočítává 24 → 0, na konci stránky „bzučák“ |
| Výsledková tabule | LED číslice, počítadla (8×, 5 000+, 2×) |
| O mně | portrét na červené desce s čárami hřiště, deska a fotka jedou při scrollu proti sobě |
| Kariéra | na desktopu se sekce připne a časová osa jede do strany; na mobilu svislá. U března 2025 se rozsvítí **5 000 teček = 5 000 bodů** |
| Tréninky | **taktická tabule**: každá oblast má vlastní rozehrávku v notaci trenérů (klikatá čára = dribling, přerušovaná = přihrávka, T = clona). Přepíná se sama, klik ji zastaví. |
| Pro koho | věková rozpětí jako graf na společné ose |
| Jak to probíhá | míč z Blenderu přihrává po křivce mezi čtyřmi kroky podle scrollu |
| Ceník | vstupenky s perforací + kalkulačka ceny na hráče (počítá jen z ceníku) |
| Kde a kdy | mapa z Figmy jako animované SVG, obce v textu zvýrazní bod na mapě |
| Kontakt | míč při scrollu letí po oblouku do koše z Blenderu, síťka se zhoupne |

### Soubory

- `assets/js/hriste.js` — celá pohybová vrstva, komentovaná po sekcích.
  `main.js` (menu, souhlas s GA) zůstal samostatný, podstránky načítají jen ten.
- `assets/img/hriste/` — `alena-dribling(-600).webp` a `alena-portret(-520).webp`
  (výřezy z `hero.jpg` a `about.jpg`), `arena(-640).webp` (pozadí úvodu),
  `mic.webp` (sprite 6 × 4 snímků, 117 kB, načte se až 800 px před sekcí),
  `kos-0…3.webp` (koš po vrstvách, míč se vkládá mezi ně).
- `blender/scene.py` — scény `arena`, `ball`, `hoop`; `blender/cutout.swift` —
  výřez postavy přes macOS Vision; `blender/oprava-masky.py` — ruční oprava
  výřezu z `hero.jpg` (Vision přibral kus tmavého pozadí u černého návleku,
  hrana návleku je v souboru odečtená po řádcích); `blender/export.sh` — z renderů
  a fotek vyrobí všechny WebP. Při výměně `hero.jpg` za jinou fotku je potřeba
  opravu v `export.sh` vypnout nebo hranu odečíst znovu. Postup:

```bash
B=/Applications/Blender.app/Contents/MacOS/Blender
for m in arena ball hoop; do $B -b --python blender/scene.py -- $m /tmp/render; done
sh blender/export.sh /tmp/render
```

  Po změně kamery u koše je potřeba změřit, kde leží střed obroučky, a opravit
  poměry 0,498 × 0,502 v `hriste.js` (sekce „Kontakt“).

### Pravidla pohybu

- **Bez JavaScriptu** je všechno vidět a ve výchozím stavu (animace zapíná třída
  `.js` z inline skriptu v `<head>`). Nadpisy zůstávají v HTML celé, rozdělení na
  slova dělá až skript, takže vyhledávače i čtečky vidí normální text.
- **Omezení pohybu** (`prefers-reduced-motion`): nic se nescrolluje ani neanimuje,
  ukážou se koncové stavy — časová osa svisle, všechny kroky rozsvícené, míč
  leží v síťce, tabule ukazuje první rozehrávku.
- Scroll řídí jedna smyčka přes `requestAnimationFrame` a počítá jen komponenty
  blízko výhledu (`IntersectionObserver`). `will-change` má jen pět prvků, které
  se hýbou s každým snímkem.
- Předky animovaných prvků mají `overflow: clip`, nikdy `hidden` (viz poznámka
  o zamrzlém rendereru na větvi `animace`).

### SEO a GEO

- Titulek, popis, kanonická URL, Open Graph a všechny texty beze změny.
- JSON-LD: `Person` doplněn o `award` (úspěchy z webu), rozšířené `knowsAbout`
  a `subjectOf` se šesti články z médií (titulek, URL, vydavatel, měsíc).
- `llms.txt` — stručné shrnutí webu pro AI vyhledávače, jen fakta z webu.
- Jeden `h1`, `h2` na sekci, obsah vizualizací je i v textu (časová osa je `<ol>`
  s `<time>`, věkový graf doplňují karty, tabule má popisky v kartách).
- LCP je výřez postavy (preload se `srcset`, 32 kB na mobilu, 64 kB na desktopu).

## Anglická verze (`/en/`)

| česky | anglicky |
|---|---|
| `index.html` | `en/index.html` |
| `ochrana-osobnich-udaju.html` | `en/privacy-policy.html` (překlad s poznámkou, že platí česká verze) |
| `404.html` | `en/404.html` (Netlify ji servíruje pro neexistující adresy pod `/en/`, pravidlo v `netlify.toml`) |

**Anglické stránky jsou samostatné soubory se stejnou strukturou.** Když se změní
text na české stránce, je potřeba ho přepsat i v anglické (a naopak). Kotvy sekcí
jsou v každém jazyce jiné (`#treninky` ↔ `#training`); jejich převodní tabulka je
v `assets/js/main.js` (`SECTIONS`) a přepínač CZ / EN podle ní pošle návštěvníka
na stejnou sekci ve druhém jazyce. Při přidání sekce ji doplň i tam.

Texty generované skriptem jsou dvojjazyčné podle `<html lang>`: lišta souhlasu
a menu v `main.js` (objekt `TEXT`), kalkulačka a formát čísel v `hriste.js`
(`1 400 Kč` ↔ `1,400 CZK`).

SEO a GEO:

- každá stránka má kanonickou URL na sebe a `hreflang` cs / en / x-default
  (x-default = česká verze), totéž je v `sitemap.xml` (`xhtml:link`)
- anglické `title`, `description`, `og:*` (`og:locale` en_GB, alternativa cs_CZ)
  a vlastní OG obrázek `assets/img/og-image-en.jpg` (vyrobený stejným příkazem
  jako český, viz níže, jen s anglickým textem)
- anglická strukturovaná data: stejná osoba (`@id` …/#alena-hanusova) jako
  v české verzi, anglický popis služby, nabídky, FAQ; články z médií mají
  `inLanguage: cs` a odkazy na ně `hreflang="cs"`
- `llms.txt` má pod českou částí anglické shrnutí
- web **nepřesměrovává** podle jazyka prohlížeče — vyhledávače by pak neviděly
  obě verze; o jazyce rozhoduje návštěvník přepínačem

## Nasazení

Web jede na **Netlify** (free tier), doména `baskethanusova.cz` je registrovaná
u **Webglobe**. Netlify neběží na Apachi, takže `.htaccess` se tam **neuplatní** —
bezpečnostní hlavičky a cache jsou proto v `netlify.toml`. `.htaccess` je
v repozitáři ponechaný pro případ přesunu na klasický hosting, na Netlify je nečinný.

Přesměrování z `http` na `https` i z `www` na doménu bez www a vystavení
certifikátu řeší Netlify samo — proto v `netlify.toml` žádná redirect pravidla nejsou.

### 1. Nahrát web na Netlify

**Cesta přes Git (doporučená — každý `git push` pak web sám aktualizuje):**

1. Založ si účet na [netlify.com](https://netlify.com). Způsob přihlášení je
   jedno — Google, GitHub i e-mail fungují stejně.
2. **Add new site → Import an existing project → GitHub**. Pokud jsi přihlášená
   jinak než přes GitHub, Netlify si teď vyžádá autorizaci GitHubu jako
   samostatný krok (instalace jeho GitHub App). U výběru repozitářů zvol
   **Only select repositories** a povol jen `web_alena_hanusova`. Autorizuj ten
   GitHub účet, který repozitář vlastní (`vystrcilova`).
3. U nastavení buildu **nech všechno prázdné** — build command žádný,
   publish directory `.`. Netlify si to přečte z `netlify.toml`.
4. **Deploy**. Za pár sekund web běží na adrese typu
   `https://nahodne-jmeno-123.netlify.app` — otevři ji a zkontroluj, že je
   všechno v pořádku.

**Cesta bez Gitu (když chceš mít web venku hned):**
Na Netlify jdi do **Sites → Add new site → Deploy manually** a přetáhni tam celou
složku projektu. `netlify.toml` se použije, protože leží v korenu. Nevýhoda je,
že každá změna znamená přetáhnout složku znovu.

### 2. Připojit doménu

1. Na Netlify: **Site configuration → Domain management → Add a domain** →
   zadej `baskethanusova.cz`.
2. Netlify se zeptá, jestli doménu chceš spravovat přes něj (změna nameserverů),
   nebo si necháš DNS u stávajícího poskytovatele. **Vyber druhou možnost**
   (*Set up the domain without Netlify DNS* / externí DNS) — viz varování níže.
3. Netlify ti vypíše konkrétní DNS záznamy. **Použij hodnoty, které ukáže on**,
   ne ty níže — Netlify svoje IP může změnit. Typicky to jsou:

   | typ | název | hodnota |
   |---|---|---|
   | `A` | `@` (koren domény, někde se zapisuje prázdné) | `75.2.60.5` |
   | `CNAME` | `www` | `tvoje-jmeno-webu.netlify.app` |

4. V administraci **Webglobe** u domény `baskethanusova.cz` otevři správu DNS
   záznamů a tyhle dva záznamy tam nastav (existující `A` záznam pro koren
   přepiš, nepřidávej druhý).
5. Zpátky na Netlify nastav jako **primární domény** `baskethanusova.cz`
   (tu bez www), aby se `www` přesměrovávalo na ni, a ne naopak.
6. Počkej, než se DNS rozšíří — obvykle desítky minut, výjimečně až 48 hodin.
   Ověřit to jde příkazem `dig +short baskethanusova.cz` (musí vrátit tu IP
   od Netlify).
7. Až doména míří na Netlify, v **Domain management → HTTPS** klikni na
   **Verify DNS configuration** a nechej vystavit certifikát Let's Encrypt.
   Je zdarma a obnovuje se sám.

### Varování: neměň u Webglobe nameservery

Netlify nabídne, že převezme DNS celé domény (změna nameserverů). **Nedělej to,
pokud na doméně běží e-mail nebo cokoli dalšího** — přesunem nameserverů přestanou
platit `MX` a další záznamy u Webglobe a e-maily přestanou chodit, dokud je
nepřeneseš do Netlify DNS. Postup výše (jen `A` a `CNAME` záznam) se ničeho
jiného nedotkne.

### 3. Po spuštění zkontrolovat

- `https://baskethanusova.cz/` načte web a prohlížeč ukazuje zamčený zámek
- `http://baskethanusova.cz` i `https://www.baskethanusova.cz` přesměrují
  na `https://baskethanusova.cz`
- `https://baskethanusova.cz/neexistuje` vrátí stylovanou 404
- `/sitemap.xml` a `/robots.txt` fungují
- Přidat web do [Google Search Console](https://search.google.com/search-console)
  a odeslat sitemapu; totéž v [Seznam Webmaster](https://search.seznam.cz)
- Spustit Lighthouse (mobil) a [validátor schema.org](https://validator.schema.org/)

### Pozor: README je na webu veřejně dostupný

Publikuje se koren repozitáře, takže `https://baskethanusova.cz/README.md` je
načtitelný. Nic tajného v něm není, ale jestli to vadí, dá se web přesunout do
podsložky `site/` a v `netlify.toml` změnit `publish = "site"`.

### Kdyby web přecházel na klasický hosting (WEDOS a podobné)

Postup je: přes FTPS nahrát **obsah** této složky do korene webu (u WEDOS `www/`,
jinde `public_html/` nebo `httpdocs/`), `.htaccess` musí skončit ve stejném
adresáři jako `index.html`, a v administraci hostingu zapnout Let's Encrypt.
`netlify.toml` se tam ignoruje, `.htaccess` naopak začne platit. Pokud by hosting
běžel na nginxu, `.htaccess` se neuplatní a přesměrování, cache a hlavičky se
musí nastavit v jeho administraci.

### Změna domény

Doména je v repozitáři na 8 místech. Přepiš je najednou:

```bash
grep -rl "baskethanusova.cz" --include="*.html" --include="*.xml" --include="*.txt" . | xargs sed -i '' 's/baskethanusova\.cz/NOVA-DOMENA.cz/g'
sed -i '' 's/baskethanusova\.cz/NOVA-DOMENA.cz/g' .htaccess
```

## Znovuvygenerování og-image

`og-image.jpg` je už vygenerovaný z hero fotky. Tímto příkazem ho vyrobíš znovu,
kdyby se fotka měnila. Vyžaduje ImageMagick (`brew install imagemagick`).
Barlow Condensed není v systému, proto je v obrázku Arial — pro finální verzi je
lepší export z Figmy.

```bash
magick -size 1200x630 xc:'#131316' \
  \( assets/img/hero.jpg -resize '560x630^' -gravity north -extent 560x630 \) \
  -gravity none -geometry +640+0 -composite \
  -fill '#D62828' -draw "rectangle 80,150 152,158" \
  -gravity northwest \
  -font Arial-Bold -pointsize 62 -fill '#FFFFFF' \
  -annotate +80+196 "ALENA HANUŠOVÁ" \
  -font Arial -pointsize 26 -fill '#A8A6AE' \
  -annotate +80+286 "Individuální basketbalové tréninky" \
  -annotate +80+322 "Praha & Beroun · od 10 let" \
  -strip -quality 86 assets/img/og-image.jpg
```

Pozor na `-gravity none` před `-composite`: `-gravity` nastavené v závorce platí
i dál, a bez resetu se fotka umístí od středu místo od levého horního rohu.

## Lokální náhled

```bash
python3 -m http.server 4173
```

Pak otevři `http://127.0.0.1:4173/`. Statický server neumí `.htaccess`, takže
přesměrování a stylovanou 404 je potřeba ověřit až na hostingu.

## Kontrola po zásahu do kódu

```bash
npx html-validate@9 index.html ochrana-osobnich-udaju.html 404.html
```

Konfigurace je v `.htmlvalidate.json`: doporučená sada bez pravidla
`no-inline-style`. Verze Hala posílá do CSS data přes vlastní vlastnosti ve
`style` (zpoždění náběhu `--delay`, věková rozpětí grafu `--from`/`--to`, výšky
log `--h`, pořadí obcí na mapě `--i`). Je to vstup pro CSS, ne styling, a jinak
by na to bylo potřeba desítky jednorázových tříd.

## Poznámky k rozhodnutím

- **Odstraněné zmínky o prevenci zranění.** Zadání mělo v sekci „Co trénujeme"
  kartu „Síla a prevence zranění" s textem o péči o kolena a kotníky, v „O mně"
  větu „Techniku učím vždy tak, aby šetřila kolena a kotníky" a u karty 20+
  formulaci „bez zbytečných zranění". Vše odstraněno na výslovné přání
  zadavatelky — trenérka není fyzioterapeutka a slibovat prevenci zranění
  nechtěla. Karta zůstala, jen se jmenuje **„Síla a kondice"** a text je
  „Zpevnění středu těla, správné dopady a práce s vlastní vahou"; mřížka tak
  má pořád 6 karet. Ikona přejmenována na `sila-kondice.svg`.
  Zmínka o vlastních zraněních v „O mně" („prošla jsem si vším: dřinou,
  zraněními…") zůstala — je to její vlastní příběh, ne slib zákazníkovi.

- **Červená na tmavém podkladu.** `--red` (`#D62828`) má na `--ink` kontrast jen
  3,7:1, což u kickeru (15 px) neprojde AA. Pro text na tmavém podkladu je proto
  token `--red-on-dark` (`#DD4A4A`, stejný odstín, 4,55:1). Na světlém podkladu
  a jako pozadí tlačítek zůstává původní `#D62828`.
- **Zkrácený titulek.** Zadání mělo titulek o 85 znacích; Google zobrazí asi 60,
  takže se konec odřezával. Zkrácen na 67 znaků:
  „Individuální basketbalové tréninky | Praha, Beroun – Alena Hanušová".
  Odchylka od doslovného textu v zadání, provedená kvůli míře prokliku.
  `og:title` zůstal podle zadání, ten se v našeptávači neřeže.
- **Strukturovaná data mají pátý uzel.** K `Person`, `Service`, `FAQPage`
  a `WebSite` přidán **`SportsActivityLocation`** kvůli lokálním výsledkům —
  jméno, popis, telefon, e-mail, `priceRange` 1400–1700 Kč, `sport`,
  `areaServed` (Praha, Beroun, okruh 20 km) a odkazy na uzly `Person`
  a `Service`. **Záměrně bez `address`:** trenérka nemá provozovnu, trénuje
  v pronajatých halách, a registrační adresa domény je soukromá adresa, která
  na veřejný web nepatří. Bez adresy sice Google nevykreslí plný odznak
  provozovny, ale hlavní páka u lokálního hledání je Profil firmy na Googlu,
  ne tahle značka.
- **Dotykové plochy.** Loga médií (24–40 px) a dlaždice v patičce (32 px) mají
  podle návrhu menší vizuální velikost, než je požadovaných 44×44. Vizuál zůstal
  a klikací plocha se rozšířila na 44 px (`min-height`, u dlaždic `::after`).
- **Sekce Reference** je hotová, ale zabalená v `<template id="reference-template">`.
  Nerenderuje se ani neindexuje. Zobrazíš ji tak, že `<template>` a `</template>`
  okolo ní smažeš a doplníš citace.
- **Mapa** je ve verzi Hala překreslená z Figmy jako inline SVG (stejné obce,
  pozice, kruh 20 km i území Prahy), takže je ostrá na retině a dá se animovat.
  Popis je v `<title>` a `role="img"`. `assets/img/mapa.png` zůstal v repozitáři,
  ale nepoužívá se.
