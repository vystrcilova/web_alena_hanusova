# Web Alena Hanušová — individuální basketbalové tréninky

Statický one-pager. Čisté HTML5 + jeden CSS + jeden JS soubor, žádný framework,
žádný bundler, žádný build krok. Co je v repozitáři, to se nahraje na hosting.

- **Doména:** `baskethanusova.cz`, registrovaná u Webglobe
- **Hosting:** Netlify (free tier), nasazení z Gitu
- **Bez cookies, bez analytiky, bez externích requestů** → web nepotřebuje cookie lištu

## Struktura

```
index.html                    hlavní stránka (všechny sekce)
ochrana-osobnich-udaju.html   zásady zpracování osobních údajů
404.html                      chybová stránka
sitemap.xml  robots.txt  site.webmanifest
netlify.toml                  hlavičky a cache pro Netlify
.htaccess                     totéž pro Apache — na Netlify nečinné
favicon.ico  favicon.svg  apple-touch-icon.png
assets/
  css/style.css               jediný stylopis (tokeny + všechny komponenty)
  js/main.js                  jediný skript (jen mobilní menu)
  fonts/                      Barlow 400/500/600, Barlow Condensed 600/700
                              woff2, subsety latin + latin-ext
  img/                        hero, about, og-image, mapa
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

Zbývá dodat:

- **`assets/icons/whatsapp.svg`** — oficiální SVG z WhatsApp Brand Resources.
  Po výměně soubor promítni i do `<symbol id="i-whatsapp">` v `index.html`,
  `ochrana-osobnich-udaju.html` a `404.html`.
- **`assets/img/mapa.svg`** — export uzlu `Mapa / Praha + 20 km od Berouna` z Figmy
  s textem převedeným na křivky. Zatím je tam vlastní schéma (Praha, kružnice 20 km,
  šest obcí), které funguje, ale nesedí na návrh.
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
  (kvůli rezervaci místa) a `data-h` na zobrazovanou výšku (24–34 px podle optické
  váhy loga). Zobrazovanou velikost řídí `data-h`, ne `width`/`height`.
- Rastry stačí ve dvojnásobku zobrazované velikosti, víc je zbytečná zátěž.

### Pás log na mobilu

Zadání chce na mobilu dvě řady po třech. Na šířce 380 px tím vyjde sloupec asi
105 px, takže široká loga (iROZHLAS 6,9:1, ČTK, CZ Basketball) se zúží podle
sloupce a proporčně sníží na 15–20 px. Poměry se nedeformují, ale drobný text
v logu ČTK je v té velikosti nečitelný a řádek působí nevyrovnaně.
Pokud to bude vadit, řešení jsou dvě: na telefonech přepnout mřížku na dva
sloupce (`grid-template-columns: repeat(2, 1fr)` do `.media-logos` pod 480 px),
nebo u ČTK použít jen kompaktní znak s globusem bez opisu.

Po výměně obrázků zvyš verzi v query stringu (`?v=2026-09` → `?v=2026-10`)
u všech odkazů v HTML, jinak se návštěvníkům roční cache neobnoví.

## Nasazení

Web jede na **Netlify** (free tier), doména `baskethanusova.cz` je registrovaná
u **Webglobe**. Netlify neběží na Apachi, takže `.htaccess` se tam **neuplatní** —
bezpečnostní hlavičky a cache jsou proto v `netlify.toml`. `.htaccess` je
v repozitáři ponechaný pro případ přesunu na klasický hosting, na Netlify je nečinný.

Přesměrování z `http` na `https` i z `www` na doménu bez www a vystavení
certifikátu řeší Netlify samo — proto v `netlify.toml` žádná redirect pravidla nejsou.

### 1. Nahrát web na Netlify

**Cesta přes Git (doporučená — každý `git push` pak web sám aktualizuje):**

1. Založ si účet na [netlify.com](https://netlify.com) (stačí přihlášení přes GitHub).
2. **Add new site → Import an existing project → GitHub**, povol Netlify přístup
   a vyber repozitář `vystrcilova/web_alena_hanusova`.
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

## Poznámky k rozhodnutím

- **Červená na tmavém podkladu.** `--red` (`#D62828`) má na `--ink` kontrast jen
  3,7:1, což u kickeru (15 px) neprojde AA. Pro text na tmavém podkladu je proto
  token `--red-on-dark` (`#DD4A4A`, stejný odstín, 4,55:1). Na světlém podkladu
  a jako pozadí tlačítek zůstává původní `#D62828`.
- **Délka titulku.** Titulek ze zadání má 85 znaků; Google zobrazí asi 60.
  Text jsem nechala podle zadání, ale zkrácení stojí za úvahu — např.
  „Individuální basketbalové tréninky | Praha, Beroun – Alena Hanušová".
- **Dotykové plochy.** Loga médií (24–40 px) a dlaždice v patičce (32 px) mají
  podle návrhu menší vizuální velikost, než je požadovaných 44×44. Vizuál zůstal
  a klikací plocha se rozšířila na 44 px (`min-height`, u dlaždic `::after`).
- **Sekce Reference** je hotová, ale zabalená v `<template id="reference-template">`.
  Nerenderuje se ani neindexuje. Zobrazíš ji tak, že `<template>` a `</template>`
  okolo ní smažeš a doplníš citace.
- **Mapa** je vložená přes `<img>`, popis je v `alt` (u `<img>` je `role="img"`
  s `aria-label` nadbytečné a s `alt=""` by si protiřečily).
