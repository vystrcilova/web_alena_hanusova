/* Pohybová vrstva webu „Hala“.

   Všechno tady je nadstavba: bez JavaScriptu je obsah vidět celý a ve
   výchozím stavu (třídu .js přidává inline skript v <head>). Při zapnutém
   omezení pohybu (prefers-reduced-motion) se nic nescrolluje ani neanimuje,
   jen se ukážou koncové stavy.

   Obsah:
     1. pomocné funkce
     2. rozdělení nadpisů na slova
     3. náběhy při scrollu, počítadla
     4. scrollovací smyčka: hlavička, časomíra, parallax, časová osa,
        přihrávky v „Jak to probíhá“, střela na koš v kontaktu
     5. taktická tabule
     6. 5 000 teček
     7. kalkulačka ceny
     8. mapa
     9. aktivní položka menu */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var MOTION = !motionQuery.matches;
  var NBSP = ' ';

  /* ------------------------------------------------------------------ */
  /* 1. Pomocné funkce                                                  */
  /* ------------------------------------------------------------------ */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /* 5000 -> "5 000" s pevnou mezerou */
  function formatNumber(value) {
    return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  }

  function tween(duration, onFrame, onDone) {
    /* ve skryté záložce rAF neběží — rovnou koncový stav */
    if (document.hidden) {
      onFrame(1);
      if (onDone) {
        onDone();
      }
      return;
    }
    var start = performance.now();
    function frame(now) {
      var t = clamp((now - start) / duration, 0, 1);
      onFrame(t);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else if (onDone) {
        onDone();
      }
    }
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ */
  /* 2. Nadpisy: každé slovo do masky                                   */
  /* ------------------------------------------------------------------ */

  /* Dělí se jen podle obyčejných mezer, takže „a&nbsp;mládež“ zůstane
     pohromadě. Vnořené elementy (červená část nadpisu) zůstávají. */
  function splitWords(root) {
    var index = 0;

    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/( +)/);
          var fragment = document.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) {
              return;
            }
            if (/^ +$/.test(part)) {
              fragment.appendChild(document.createTextNode(' '));
              return;
            }
            var outer = document.createElement('span');
            var inner = document.createElement('span');
            outer.className = 'w';
            inner.className = 'w__i';
            inner.style.setProperty('--wi', index++);
            inner.textContent = part;
            outer.appendChild(inner);
            fragment.appendChild(outer);
          });
          node.replaceChild(fragment, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    }

    walk(root);
  }

  if (MOTION) {
    $$('[data-split]').forEach(splitWords);
  }

  /* ------------------------------------------------------------------ */
  /* 3. Náběhy při scrollu a počítadla                                  */
  /* ------------------------------------------------------------------ */

  $$('[data-reveal-group]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var from = parseFloat(el.getAttribute('data-count-from') || '0');
    var isYear = el.hasAttribute('data-count-from');
    tween(isYear ? 1100 : 1600, function (t) {
      var value = from + (target - from) * easeOut(t);
      el.textContent = isYear ? String(Math.round(value)) : formatNumber(value);
    });
  }

  var revealTargets = $$('[data-reveal], [data-reveal-group], [data-split]');

  /* úvod je vidět hned: náběh podle zpoždění v CSS, ne podle scrollu */
  revealTargets = revealTargets.filter(function (el) {
    if (el.closest('.hero')) {
      requestAnimationFrame(function () {
        el.classList.add('is-in');
      });
      return false;
    }
    return true;
  });

  if (MOTION && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        var el = entry.target;
        el.classList.add('is-in');
        $$('[data-count]', el).forEach(function (counter) {
          if (!counter.closest('.career__event--points')) {
            countUp(counter);
          }
        });
        revealObserver.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add('is-in');
    });
  }

  /* ------------------------------------------------------------------ */
  /* 4. Scrollovací smyčka                                              */
  /* ------------------------------------------------------------------ */

  var header = $('#site-header');
  var brandBalls = $$('.brand__ball');
  var shotClock = $('#shot-clock');
  var shotClockBox = shotClock && shotClock.parentNode;
  var lastClock = null;
  var viewportH = window.innerHeight;
  var viewportW = window.innerWidth;

  /* Komponenty řízené scrollem. Každá má element a update(rect). Počítají
     se jen ty, které jsou blízko výhledu. */
  var scrollParts = [];
  var activeParts = new Set();

  function registerPart(el, update, setup) {
    if (!el) {
      return;
    }
    var part = { el: el, update: update, setup: setup };
    scrollParts.push(part);
    if (setup) {
      setup(part);
    }
  }

  var partObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var part = scrollParts.filter(function (p) {
          return p.el === entry.target;
        })[0];
        if (!part) {
          return;
        }
        if (entry.isIntersecting) {
          activeParts.add(part);
        } else {
          activeParts.delete(part);
        }
      });
      requestTick();
    }, { rootMargin: '25% 0px 25% 0px' })
    : null;

  var ticking = false;

  function requestTick() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onFrame);
    }
  }

  function onFrame() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - viewportH);

    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
    }

    brandBalls.forEach(function (ball) {
      ball.style.setProperty('--spin', (y * 0.3).toFixed(1));
    });

    if (shotClock) {
      var seconds = clamp(Math.ceil(24 * (1 - y / maxScroll)), 0, 24);
      if (seconds !== lastClock) {
        shotClock.textContent = seconds < 10 ? '0' + seconds : String(seconds);
        shotClockBox.classList.toggle('is-buzzer', seconds === 0);
        lastClock = seconds;
      }
    }

    activeParts.forEach(function (part) {
      part.update(part.el.getBoundingClientRect(), part);
    });
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', function () {
    viewportH = window.innerHeight;
    viewportW = window.innerWidth;
    scrollParts.forEach(function (part) {
      if (part.setup) {
        part.setup(part);
      }
    });
    requestTick();
  });

  /* Míč z Blenderu (sprite 6 × 4): načte se, až je sekce do 800 px. */
  var sprites = $$('.ball-sprite');
  if (sprites.length && 'IntersectionObserver' in window) {
    var spriteObserver = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        sprites.forEach(function (el) {
          el.classList.add('is-loaded');
        });
        spriteObserver.disconnect();
      }
    }, { rootMargin: '800px 0px' });
    sprites.forEach(function (el) {
      spriteObserver.observe(el);
    });
  }

  function setSpriteFrame(el, frame) {
    var f = ((Math.floor(frame) % 24) + 24) % 24;
    el.style.setProperty('--col', f % 6);
    el.style.setProperty('--row', Math.floor(f / 6));
  }

  if (MOTION) {
    /* --- Úvod: parallax scény a textu --- */
    var hero = $('.hero');
    registerPart(hero, function (rect) {
      var p = clamp(-rect.top / rect.height, 0, 1);
      hero.style.setProperty('--p', p.toFixed(4));
      $('.stage', hero).style.setProperty('--p', p.toFixed(4));
    });

    /* --- O mně: červená deska a portrét jedou různou rychlostí --- */
    var aboutFigure = $('.about__figure');
    registerPart(aboutFigure, function (rect) {
      var p = clamp((viewportH - rect.top) / (viewportH + rect.height), 0, 1);
      aboutFigure.style.setProperty('--p', p.toFixed(4));
    });

    /* --- Kariéra: na desktopu se pás posouvá do strany --- */
    var career = $('.career');
    var careerTrack = career && $('.career__track', career);
    var careerRail = career && $('.career__rail-fill', career);
    var careerEvents = career ? $$('.career__event', career) : [];
    var dotsStarted = false;

    registerPart(career, function (rect, part) {
      var litLine;
      if (part.pinned) {
        var distance = career.offsetHeight - viewportH;
        var p = clamp(-rect.top / distance, 0, 1);
        var x = p * part.travel;
        careerTrack.style.setProperty('--x', x.toFixed(1));
        careerRail.parentNode.style.setProperty('--rail', p.toFixed(4));
        litLine = viewportW * 0.62;
        careerEvents.forEach(function (event) {
          var left = event.offsetLeft - x;
          event.classList.toggle('is-lit', left < litLine);
        });
      } else {
        litLine = viewportH * 0.7;
        careerEvents.forEach(function (event) {
          event.classList.toggle('is-lit', event.getBoundingClientRect().top < litLine);
        });
      }
      var pointsEvent = $('.career__event--points', career);
      if (!dotsStarted && pointsEvent && pointsEvent.classList.contains('is-lit')) {
        dotsStarted = true;
        startDots(pointsEvent);
      }
    }, function (part) {
      var wide = window.matchMedia('(min-width: 1024px)').matches;
      part.pinned = wide;
      career.classList.toggle('is-pinned', wide);
      if (wide) {
        careerTrack.style.setProperty('--x', 0);
        part.travel = Math.max(0, careerTrack.scrollWidth - viewportW);
        career.style.height = (part.travel + viewportH * 1.15) + 'px';
      } else {
        career.style.height = '';
      }
    });

    /* --- Jak to probíhá: přihrávky mezi čísly kroků --- */
    var process = $('.process');
    var field = process && $('.process__field', process);
    var pathBase = process && $('.process__path-base', process);
    var pathLine = process && $('.process__path-line', process);
    var processBall = process && $('.process__ball', process);
    var steps = process ? $$('.steps__item', process) : [];

    registerPart(process, function () {
      if (!field.dataset.ready) {
        return;
      }
      var rect = field.getBoundingClientRect();
      var p = clamp((viewportH * 0.72 - rect.top) / (rect.height * 0.9), 0, 1);
      process.style.setProperty('--p', p.toFixed(4));
      pathLine.style.strokeDashoffset = (1 - p).toFixed(4);
      var point = pathBase.getPointAtLength(p * field._length);
      processBall.style.setProperty('--bx', point.x.toFixed(1) + 'px');
      processBall.style.setProperty('--by', point.y.toFixed(1) + 'px');
      setSpriteFrame(processBall, p * 48);
      steps.forEach(function (step, i) {
        step.classList.toggle('is-lit', p >= field._stops[i] - 0.001);
      });
    }, function () {
      buildProcessPath();
    });

    function buildProcessPath() {
      var fieldRect = field.getBoundingClientRect();
      var points = steps.map(function (step) {
        var r = $('.steps__num', step).getBoundingClientRect();
        return { x: r.left - fieldRect.left + r.width / 2, y: r.top - fieldRect.top + r.height / 2 };
      });
      if (points.length < 2) {
        return;
      }
      /* Catmull-Rom -> Bézier: plynulá křivka přes všechna čísla */
      var d = 'M' + points[0].x + ' ' + points[0].y;
      for (var i = 0; i < points.length - 1; i++) {
        var p0 = points[i - 1] || points[i];
        var p1 = points[i];
        var p2 = points[i + 1];
        var p3 = points[i + 2] || p2;
        var c1x = p1.x + (p2.x - p0.x) / 6;
        var c1y = p1.y + (p2.y - p0.y) / 6;
        var c2x = p2.x - (p3.x - p1.x) / 6;
        var c2y = p2.y - (p3.y - p1.y) / 6;
        d += 'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
      }
      pathBase.setAttribute('d', d);
      pathLine.setAttribute('d', d);
      field._length = pathBase.getTotalLength();

      /* kde na křivce leží jednotlivá čísla (0–1) */
      field._stops = points.map(function (pt, index) {
        if (index === 0) {
          return 0;
        }
        if (index === points.length - 1) {
          return 1;
        }
        var best = 0;
        var bestDist = Infinity;
        for (var s = 0; s <= 200; s++) {
          var q = pathBase.getPointAtLength(field._length * s / 200);
          var dist = (q.x - pt.x) * (q.x - pt.x) + (q.y - pt.y) * (q.y - pt.y);
          if (dist < bestDist) {
            bestDist = dist;
            best = s / 200;
          }
        }
        return best;
      });
      field.dataset.ready = '1';
      process.classList.add('is-ready');
    }

    /* --- Kontakt: míč letí po oblouku do koše --- */
    var contact = $('.contact');
    var hoop = contact && $('.contact__hoop', contact);
    var shotBall = contact && $('.contact__ball', contact);

    registerPart(contact, function (rect) {
      var p = clamp((viewportH - rect.top) / (viewportH * 0.78), 0, 1);
      var w = hoop.offsetWidth;
      var h = hoop.offsetHeight;
      /* střed obroučky v obrázku koše: 49,8 % × 50,2 % */
      var rim = { x: w * 0.498, y: h * 0.502 };
      var start = { x: rim.x - w * 1.25, y: rim.y + w * 0.95 };
      var control = { x: rim.x - w * 0.55, y: rim.y - w * 1.05 };
      var entry = { x: rim.x, y: rim.y - w * 0.06 };
      var drop = { x: rim.x, y: rim.y + w * 0.33 };
      var x;
      var y;
      var split = 0.84;
      if (p < split) {
        var t = p / split;
        var mt = 1 - t;
        x = mt * mt * start.x + 2 * mt * t * control.x + t * t * entry.x;
        y = mt * mt * start.y + 2 * mt * t * control.y + t * t * entry.y;
      } else {
        var k = easeOut((p - split) / (1 - split));
        x = entry.x;
        y = entry.y + (drop.y - entry.y) * k;
      }
      shotBall.style.setProperty('--bx', x.toFixed(1) + 'px');
      shotBall.style.setProperty('--by', y.toFixed(1) + 'px');
      shotBall.style.setProperty('--bo', clamp(p * 6, 0, 1).toFixed(3));
      setSpriteFrame(shotBall, -p * 40);
      var swish = p > 0.93;
      if (swish && !contact.classList.contains('is-swish')) {
        contact.classList.add('is-swish');
      } else if (p < 0.8) {
        contact.classList.remove('is-swish');
      }
    });
  } else {
    /* bez pohybu: koncové stavy */
    $$('.career__event').forEach(function (event) {
      event.classList.add('is-lit');
    });
    $$('.steps__item').forEach(function (step) {
      step.classList.add('is-lit');
    });
    var restBall = $('.contact__ball');
    var restHoop = $('.contact__hoop');
    if (restBall && restHoop) {
      restBall.style.setProperty('--bx', (restHoop.offsetWidth * 0.498) + 'px');
      restBall.style.setProperty('--by', (restHoop.offsetHeight * 0.502 + restHoop.offsetWidth * 0.2) + 'px');
      restBall.style.setProperty('--bo', 1);
    }
    var points = $('.career__event--points');
    if (points) {
      startDots(points);
    }
  }

  scrollParts.forEach(function (part) {
    if (partObserver) {
      partObserver.observe(part.el);
    } else {
      activeParts.add(part);
    }
  });

  /* rozměry se ustálí až po načtení písem a obrázků */
  window.addEventListener('load', function () {
    scrollParts.forEach(function (part) {
      if (part.setup) {
        part.setup(part);
      }
    });
    requestTick();
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      scrollParts.forEach(function (part) {
        if (part.setup) {
          part.setup(part);
        }
      });
      requestTick();
    });
  }
  requestTick();

  /* ------------------------------------------------------------------ */
  /* 5. Taktická tabule                                                 */
  /* ------------------------------------------------------------------ */

  (function playbook() {
    var board = $('.playbook__board');
    if (!board) {
      return;
    }
    var svg = $('.court', board);
    var plays = $$('.play');
    var caption = $('.playbook__caption-title', board);
    var PLAY_MS = 5600;
    var current = null;
    var autoTimer = null;
    var userTook = false;
    var visible = false;
    var paused = false;
    var ballRuns = [];

    /* klikatá čára driblingu podle vodicí křivky */
    $$('[data-zigzag]', svg).forEach(function (path) {
      var base = $(path.getAttribute('data-zigzag'), svg);
      var length = base.getTotalLength();
      var step = 30;
      var amp = 16;
      var d = '';
      var count = Math.floor(length / step);
      for (var i = 0; i <= count; i++) {
        var s = Math.min(length, i * step);
        var pt = base.getPointAtLength(s);
        var ahead = base.getPointAtLength(Math.min(length, s + 1));
        var behind = base.getPointAtLength(Math.max(0, s - 1));
        var dx = ahead.x - behind.x;
        var dy = ahead.y - behind.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var off = (i === 0 || i >= count - 1) ? 0 : (i % 2 ? amp : -amp);
        var x = pt.x - (dy / len) * off;
        var y = pt.y + (dx / len) * off;
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      var end = base.getPointAtLength(length);
      d += 'L' + end.x.toFixed(1) + ' ' + end.y.toFixed(1);
      path.setAttribute('d', d);
    });

    function runBalls(diagram) {
      ballRuns.forEach(function (run) {
        run.cancelled = true;
      });
      ballRuns = [];
      $$('.d-ball', svg).forEach(function (ball) {
        ball.style.opacity = 0;
      });
      if (!MOTION) {
        return;
      }
      $$('.d-ball', diagram).forEach(function (ball) {
        var path = $(ball.getAttribute('data-path'), svg);
        var length = path.getTotalLength();
        var delay = parseFloat(ball.getAttribute('data-delay')) * 1000;
        var duration = parseFloat(ball.getAttribute('data-dur')) * 1000;
        var stays = !/^#shot-|^#pass-/.test(ball.getAttribute('data-path'));
        var run = { cancelled: false };
        ballRuns.push(run);
        var start = performance.now() + delay;
        (function frame(now) {
          if (run.cancelled) {
            return;
          }
          var t = (now - start) / duration;
          if (t >= 0) {
            var k = clamp(t, 0, 1);
            var eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            var pt = path.getPointAtLength(eased * length);
            ball.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
            ball.style.opacity = stays ? 1 : (k > 0.92 ? (1 - k) / 0.08 : 1);
          }
          if (t < 1) {
            requestAnimationFrame(frame);
          }
        })(performance.now());
      });
    }

    function activate(name, fromUser) {
      var diagram = $('.diagram[data-diagram="' + name + '"]', svg);
      if (!diagram) {
        return;
      }
      current = name;
      plays.forEach(function (play) {
        var on = play.getAttribute('data-play') === name;
        play.classList.toggle('is-active', on);
        play.classList.remove('is-timing');
        $('.play__btn', play).setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) {
          caption.textContent = $('.play__btn', play).textContent;
        }
      });
      $$('.diagram', svg).forEach(function (d) {
        d.classList.remove('is-active');
      });
      void diagram.getBoundingClientRect(); // restart přechodů
      diagram.classList.add('is-active');
      runBalls(diagram);
      if (fromUser) {
        userTook = true;
        stopAuto();
      } else {
        scheduleAuto();
      }
    }

    function next() {
      var index = plays.findIndex(function (p) {
        return p.getAttribute('data-play') === current;
      });
      activate(plays[(index + 1) % plays.length].getAttribute('data-play'), false);
    }

    function stopAuto() {
      clearTimeout(autoTimer);
      autoTimer = null;
      plays.forEach(function (p) {
        p.classList.remove('is-timing');
      });
    }

    function scheduleAuto() {
      stopAuto();
      if (!MOTION || userTook || !visible || paused) {
        return;
      }
      var active = $('.play.is-active');
      if (active) {
        active.style.setProperty('--play-ms', PLAY_MS + 'ms');
        void active.offsetWidth;
        active.classList.add('is-timing');
      }
      autoTimer = setTimeout(next, PLAY_MS);
    }

    plays.forEach(function (play) {
      $('.play__btn', play).addEventListener('click', function () {
        activate(play.getAttribute('data-play'), true);
      });
    });

    var section = $('#treninky');
    section.addEventListener('mouseenter', function () {
      paused = true;
      stopAuto();
    });
    section.addEventListener('mouseleave', function () {
      paused = false;
      scheduleAuto();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !current) {
          activate('strelba', false);
        } else if (visible) {
          scheduleAuto();
        } else {
          stopAuto();
        }
      }, { threshold: 0.35 }).observe(board);
    } else {
      activate('strelba', false);
    }
  })();

  /* ------------------------------------------------------------------ */
  /* 6. 5 000 teček = 5 000 bodů                                         */
  /* ------------------------------------------------------------------ */

  function startDots(event) {
    var canvas = $('.dots', event);
    var counter = $('.career__points-num', event);
    if (!canvas || !canvas.getContext) {
      return;
    }
    var COLS = 100;
    var ROWS = 50;
    var TOTAL = COLS * ROWS;
    var ctx = canvas.getContext('2d');
    var ratio = window.devicePixelRatio || 1;
    var width = canvas.clientWidth || 500;
    var height = width / 2;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.scale(ratio, ratio);
    var gap = width / COLS;
    var radius = Math.max(0.7, gap * 0.3);

    /* pořadí rozsvícení: po sloupcích zleva, s trochou náhody uvnitř sloupce */
    var order = [];
    for (var c = 0; c < COLS; c++) {
      for (var r = 0; r < ROWS; r++) {
        order.push({ c: c, r: r, k: c + Math.random() * 3 });
      }
    }
    order.sort(function (a, b) {
      return a.k - b.k;
    });

    function draw(lit) {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < TOTAL; i++) {
        var dot = order[i];
        ctx.beginPath();
        ctx.fillStyle = i < lit ? '#e5484d' : 'rgba(255,255,255,0.09)';
        ctx.arc(dot.c * gap + gap / 2, dot.r * gap + gap / 2, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (!MOTION) {
      draw(TOTAL);
      return;
    }
    draw(0);
    tween(2600, function (t) {
      var lit = Math.round(TOTAL * easeOut(t));
      draw(lit);
      if (counter) {
        counter.textContent = formatNumber(lit);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* 7. Kalkulačka ceny                                                 */
  /* ------------------------------------------------------------------ */

  (function calculator() {
    var form = $('#calc');
    if (!form) {
      return;
    }
    var PRICE_SINGLE = 1400;
    var PRICE_GROUP = 1700;
    var HALL_DISCOUNT = 300;
    var bars = $$('.calc__bar', form);
    var perValue = $('.calc__per-value', form);
    var totalText = $('.calc__total', form);
    var shownPer = PRICE_SINGLE;

    function totalFor(players, ownHall) {
      return (players === 1 ? PRICE_SINGLE : PRICE_GROUP) - (ownHall ? HALL_DISCOUNT : 0);
    }

    function update() {
      var players = parseInt($('input[name="hraci"]:checked', form).value, 10);
      var ownHall = $('input[name="hala"]', form).checked;
      var total = totalFor(players, ownHall);
      var per = Math.round(total / players);

      bars.forEach(function (bar) {
        var n = parseInt(bar.getAttribute('data-n'), 10);
        var value = Math.round(totalFor(n, ownHall) / n);
        bar.style.setProperty('--v', value);
        $('.calc__bar-value', bar).textContent = formatNumber(value);
        bar.classList.toggle('is-current', n === players);
      });

      totalText.textContent = 'celkem ' + formatNumber(total) + NBSP + 'Kč za 60' + NBSP + 'minut';

      var from = shownPer;
      if (!MOTION || from === per) {
        perValue.textContent = formatNumber(per) + NBSP + 'Kč';
        shownPer = per;
        return;
      }
      tween(500, function (t) {
        perValue.textContent = formatNumber(from + (per - from) * easeOut(t)) + NBSP + 'Kč';
      });
      shownPer = per;
    }

    form.addEventListener('change', update);
    update();
  })();

  /* ------------------------------------------------------------------ */
  /* 8. Mapa: obce v textu ↔ body na mapě                               */
  /* ------------------------------------------------------------------ */

  (function map() {
    var svg = $('#map');
    if (!svg) {
      return;
    }
    function setHot(name, on) {
      $$('[data-town="' + name + '"]').forEach(function (el) {
        el.classList.toggle('is-hot', on);
      });
    }
    $$('[data-town]').forEach(function (el) {
      var name = el.getAttribute('data-town');
      el.addEventListener('mouseenter', function () {
        setHot(name, true);
      });
      el.addEventListener('mouseleave', function () {
        setHot(name, false);
      });
    });
  })();

  /* ------------------------------------------------------------------ */
  /* 9. Aktivní položka menu podle sekce                                */
  /* ------------------------------------------------------------------ */

  (function activeNav() {
    var links = $$('.nav__link');
    if (!links.length || !('IntersectionObserver' in window)) {
      return;
    }
    var byId = {};
    links.forEach(function (link) {
      byId[link.getAttribute('href').slice(1)] = link;
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (link && entry.isIntersecting) {
          links.forEach(function (l) {
            l.removeAttribute('aria-current');
          });
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) {
        observer.observe(section);
      }
    });
  })();
})();
