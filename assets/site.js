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

  function setupTopFeatureSwitcher() {
    var demoImage = document.getElementById('lp-feature-demo-image');
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.lp-feature-card[data-feature-target]'));
    if (!demoImage || !buttons.length) return;

    var previews = Array.prototype.slice.call(document.querySelectorAll('.lp-feature-mobile-preview[id]'));
    var articles = Array.prototype.slice.call(document.querySelectorAll('.lp-feature-article[data-feature-article]'));

    function activate(button) {
      var target = button.getAttribute('data-feature-target');
      var image = button.getAttribute('data-feature-image');
      var alt = button.getAttribute('data-feature-alt') || '';

      buttons.forEach(function (item) {
        var isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });

      if (image) {
        demoImage.src = image;
        demoImage.alt = alt;
      }

      previews.forEach(function (preview) {
        preview.classList.toggle('is-open', preview.id === target);
      });

      articles.forEach(function (article) {
        article.classList.toggle('is-open', article.getAttribute('data-feature-article') === target);
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        activate(button);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupMobileMenu();
      setupCurrentNav();
      setupTopFeatureSwitcher();
    });
  } else {
    setupMobileMenu();
    setupCurrentNav();
    setupTopFeatureSwitcher();
  }
})();
