(function () {
  function setupMobileMenu() {
    document.querySelectorAll('.site-header').forEach(function (header, index) {
      var button = header.querySelector('.mobile-menu-button');
      var nav = header.querySelector('.global-nav');
      if (!button || !nav || button.dataset.menuReady === 'true') return;

      var navId = nav.id || 'global-nav-' + index;
      nav.id = navId;
      button.dataset.menuReady = 'true';
      button.setAttribute('aria-controls', navId);
      button.setAttribute('aria-expanded', 'false');

      button.addEventListener('click', function () {
        var isOpen = header.classList.toggle('is-menu-open');
        button.classList.toggle('is-active', isOpen);
        button.setAttribute('aria-expanded', String(isOpen));
      });

      nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          header.classList.remove('is-menu-open');
          button.classList.remove('is-active');
          button.setAttribute('aria-expanded', 'false');
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMobileMenu);
  } else {
    setupMobileMenu();
  }
})();
