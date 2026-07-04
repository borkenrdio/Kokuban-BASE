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

  function normalizePath(path) {
    return path.replace(/\/index\.html$/, '/').replace(/\/+$/, '/');
  }

  function setupCurrentNav() {
    var currentPath = normalizePath(window.location.pathname || '/');

    document.querySelectorAll('.global-nav').forEach(function (nav) {
      nav.querySelectorAll('a[href]').forEach(function (link) {
        var url;
        try {
          url = new URL(link.getAttribute('href'), window.location.href);
        } catch (error) {
          return;
        }

        var linkPath = normalizePath(url.pathname || '/');
        var isCurrent = linkPath !== '/' && (currentPath === linkPath || currentPath.indexOf(linkPath) === 0);

        link.classList.toggle('is-current', isCurrent);
        if (isCurrent) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupMobileMenu();
      setupCurrentNav();
    });
  } else {
    setupMobileMenu();
    setupCurrentNav();
  }
})();
