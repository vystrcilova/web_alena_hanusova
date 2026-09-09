/* Jediný skript webu: mobilní menu. Vše ostatní funguje bez JS. */
(function () {
  'use strict';

  var toggle = document.getElementById('nav-toggle');
  var drawer = document.getElementById('nav-drawer');

  if (!toggle || !drawer) {
    return;
  }

  function setOpen(open) {
    drawer.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
  }

  toggle.addEventListener('click', function () {
    setOpen(drawer.hidden);
  });

  // klik na odkaz menu zavře
  drawer.addEventListener('click', function (event) {
    if (event.target.closest('a')) {
      setOpen(false);
    }
  });

  // Escape zavře a vrátí fokus na tlačítko
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !drawer.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });

  // po zvětšení na desktop se menu skryje, aby nezůstalo otevřené
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024 && !drawer.hidden) {
      setOpen(false);
    }
  });
})();
