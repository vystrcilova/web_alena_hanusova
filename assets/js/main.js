/* Základní skript webu: mobilní menu, přepínač jazyka a souhlas s analytikou.
   Běží na všech stránkách v obou jazycích. Vše ostatní funguje bez JS. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Nastavení                                                          */
  /* ------------------------------------------------------------------ */

  /* Měřicí ID z Google Analytics 4:
     GA4 → Správa → Datové streamy → Web → „ID měření“ (tvar G-XXXXXXXXXX).
     Dokud tu zůstane placeholder, lišta se vůbec nezobrazí a nic se nenačte —
     web se chová, jako by žádná analytika nebyla. */
  var GA_ID = 'G-G7GBSGLB71';

  var STORAGE_KEY = 'ah-analytika-souhlas';
  var GA_PLACEHOLDER = 'G-XXXXXXXXXX';
  var GA_ENABLED = GA_ID !== GA_PLACEHOLDER && /^G-[A-Z0-9]{6,}$/.test(GA_ID);

  /* Jazyk stránky podle <html lang>. Anglická verze leží v /en/. */
  var LANG = (document.documentElement.lang || 'cs').slice(0, 2) === 'en' ? 'en' : 'cs';
  var TEXT = {
    cs: {
      menuOpen: 'Otevřít menu',
      menuClose: 'Zavřít menu',
      consentTitle: 'Měření návštěvnosti',
      consentText: 'Rád(a) bych věděla, kolik lidí web najde a co je zajímá. ' +
        'K tomu používám Google Analytics, které si do prohlížeče ukládá cookies. ' +
        'Bez tvého souhlasu se nespustí a web funguje úplně stejně. ' +
        '<a href="/ochrana-osobnich-udaju.html">Podrobnosti v zásadách zpracování údajů</a>.',
      accept: 'Souhlasím',
      decline: 'Odmítnout',
      settingsOn: 'Vypnout měření návštěvnosti',
      settingsOff: 'Nastavení měření návštěvnosti'
    },
    en: {
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      consentTitle: 'Visitor analytics',
      consentText: 'I’d like to know how many people find this website and what they are interested in. ' +
        'For that I use Google Analytics, which stores cookies in your browser. ' +
        'It won’t run without your consent, and the website works exactly the same either way. ' +
        '<a href="/en/privacy-policy.html">Details in the privacy policy</a>.',
      accept: 'Accept',
      decline: 'Decline',
      settingsOn: 'Turn off visitor analytics',
      settingsOff: 'Visitor analytics settings'
    }
  }[LANG];

  /* ------------------------------------------------------------------ */
  /* Mobilní menu                                                       */
  /* ------------------------------------------------------------------ */

  var toggle = document.getElementById('nav-toggle');
  var drawer = document.getElementById('nav-drawer');

  if (toggle && drawer) {
    setMenu(false);

    toggle.addEventListener('click', function () {
      setMenu(drawer.hidden);
    });

    drawer.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        setMenu(false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !drawer.hidden) {
        setMenu(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && !drawer.hidden) {
        setMenu(false);
      }
    });
  }

  function setMenu(open) {
    drawer.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? TEXT.menuClose : TEXT.menuOpen);
  }

  /* ------------------------------------------------------------------ */
  /* Přepínač jazyka                                                    */
  /* ------------------------------------------------------------------ */

  /* Kotvy sekcí na hlavní stránce: česká ↔ anglická. Při přepnutí jazyka
     se návštěvník dostane na stejnou sekci, kterou má právě před sebou. */
  var SECTIONS = [
    ['top', 'top'], ['o-mne', 'about'], ['kariera', 'career'], ['media', 'media'],
    ['treninky', 'training'], ['pro-koho', 'audience'], ['prubeh', 'how-it-works'],
    ['cenik', 'pricing'], ['praha-beroun', 'prague-beroun'], ['faq', 'faq'],
    ['kontakt', 'contact']
  ];

  function currentSection() {
    var own = LANG === 'en' ? 1 : 0;
    var line = window.innerHeight * 0.35;
    var found = null;
    SECTIONS.forEach(function (pair) {
      var el = document.getElementById(pair[own]);
      if (el && el.getBoundingClientRect().top <= line) {
        found = pair;
      }
    });
    return found;
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-lang-switch]'), function (link) {
    link.addEventListener('click', function () {
      var target = link.getAttribute('data-lang-switch');
      var href = link.getAttribute('href');
      if (target === LANG || href.slice(-1) !== '/') {
        return;
      }
      var pair = currentSection();
      if (pair && pair[0] !== 'top') {
        link.setAttribute('href', href + '#' + pair[target === 'en' ? 1 : 0]);
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Souhlas s analytikou                                               */
  /* ------------------------------------------------------------------ */

  /* Uložený souhlas čteme obezřetně — v anonymním okně nebo při zakázaných
     datech stránek localStorage vyhodí výjimku. */
  function readConsent() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      /* Bez uloženého souhlasu se lišta zobrazí znovu. To je v pořádku —
         analytika se bez kliknutí nespustí. */
    }
  }

  /* GA se načítá teprve tady, tedy až po kliknutí na souhlas. Před ním
     nejde na Google ani jeden požadavek. */
  function loadAnalytics() {
    if (!GA_ENABLED || window.__gaLoaded) {
      return;
    }
    window.__gaLoaded = true;

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    /* Reklamní kategorie zamítáme trvale — web needěláme na reklamu
       a měření návštěvnosti je nepotřebuje. */
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted'
    });

    gtag('js', new Date());
    gtag('config', GA_ID);

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(script);
  }

  var banner = null;

  function buildBanner() {
    var wrap = document.createElement('div');
    wrap.className = 'consent';
    wrap.id = 'consent';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-labelledby', 'consent-title');
    wrap.setAttribute('aria-describedby', 'consent-text');

    wrap.innerHTML =
      '<div class="consent__inner">' +
        '<div class="consent__body">' +
          '<h2 class="consent__title" id="consent-title">' + TEXT.consentTitle + '</h2>' +
          '<p class="consent__text" id="consent-text">' + TEXT.consentText + '</p>' +
        '</div>' +
        '<div class="consent__actions">' +
          '<button class="btn btn--primary btn--sm" type="button" data-consent="ano">' + TEXT.accept + '</button>' +
          '<button class="btn btn--secondary btn--sm" type="button" data-consent="ne">' + TEXT.decline + '</button>' +
        '</div>' +
      '</div>';

    wrap.addEventListener('click', function (event) {
      var button = event.target.closest('[data-consent]');
      if (!button) {
        return;
      }
      var value = button.getAttribute('data-consent');
      writeConsent(value);
      hideBanner();
      if (value === 'ano') {
        loadAnalytics();
      }
    });

    /* Lištu vkládáme na začátek <body>, aby na ni klávesnice narazila hned,
       i když je vizuálně dole. */
    document.body.insertBefore(wrap, document.body.firstChild);
    return wrap;
  }

  function showBanner() {
    if (!banner) {
      banner = buildBanner();
    }
    banner.hidden = false;
  }

  function hideBanner() {
    if (banner) {
      banner.hidden = true;
    }
    updateSettingsButton();
  }

  /* Odvolání souhlasu — tlačítko v patičce. Bez možnosti odvolat by souhlas
     nebyl podle GDPR platný. */
  function updateSettingsButton() {
    var button = document.getElementById('consent-settings');
    if (!button) {
      return;
    }
    if (!GA_ENABLED) {
      button.hidden = true;
      return;
    }
    button.hidden = false;
    button.textContent = readConsent() === 'ano'
      ? TEXT.settingsOn
      : TEXT.settingsOff;
  }

  function initConsent() {
    var settings = document.getElementById('consent-settings');

    if (settings) {
      settings.addEventListener('click', function () {
        if (readConsent() === 'ano') {
          writeConsent('ne');
          updateSettingsButton();
          /* GA už je na stránce načtené; skutečné vypnutí nastane po
             obnovení stránky, proto ji hned znovu načteme. */
          window.location.reload();
          return;
        }
        showBanner();
      });
    }

    updateSettingsButton();

    if (!GA_ENABLED) {
      return;
    }

    var stored = readConsent();
    if (stored === 'ano') {
      loadAnalytics();
    } else if (stored !== 'ne') {
      showBanner();
    }
  }

  initConsent();
})();
