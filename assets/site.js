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

  /* 30秒診断のフローティング誘導。
     出すタイミング: 通常ページでは少し待って表示、スクロール時にも表示。
     × で閉じたら7日間は再表示しない。コラム系・診断ページでは出さない。 */
  function setupCheckPromo() {
    var path = window.location.pathname || '/';
    if (/^\/(check|article|columns)(\/|$)/.test(path)) return;
    if (document.querySelector('.kb-checkfloat')) return;

    var DISMISS_KEY = 'kbCheckPromoDismissedAtV2';
    var DISMISS_DAYS = 7;

    try {
      var dismissedAt = parseInt(localStorage.getItem(DISMISS_KEY), 10) || 0;
      if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    } catch (error) { /* storage不可なら常に表示候補 */ }

    var el = null;
    var shown = false;

    function build() {
      var wrap = document.createElement('div');
      wrap.className = 'kb-checkfloat';
      wrap.innerHTML =
        '<button type="button" class="kb-checkfloat__close" aria-label="このお知らせを閉じる">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
        '<a class="kb-checkfloat__link" href="/check/">' +
          '<span class="kb-checkfloat__icon" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6v3H9z"/><path d="M15 4.5h2A2 2 0 0 1 19 6.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h2"/><path d="m8.8 13.2 2.3 2.3 4.2-4.6"/></svg>' +
          '</span>' +
          '<span class="kb-checkfloat__body">' +
            '<small>かんたん30秒</small>' +
            '<strong>あなたの教室に合う<br>電子黒板は？</strong>' +
            '<b>5問で、ブランド・サイズ・選び方が分かる</b>' +
          '</span>' +
          '<i aria-hidden="true">›</i>' +
        '</a>';
      document.body.appendChild(wrap);

      wrap.querySelector('.kb-checkfloat__close').addEventListener('click', function () {
        wrap.classList.remove('is-visible');
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (error) {}
        if (typeof gtag === 'function') gtag('event', 'checkfloat_dismiss', { page_path: path });
        setTimeout(function () { wrap.remove(); }, 550);
      });
      wrap.querySelector('.kb-checkfloat__link').addEventListener('click', function () {
        if (typeof gtag === 'function') gtag('event', 'checkfloat_click', { page_path: path });
      });
      return wrap;
    }

    function show() {
      if (shown) return;
      shown = true;
      window.removeEventListener('scroll', onScroll);
      if (!el) el = build();
      /* 一度レイアウトを確定させてからクラスを付け、スライドインを確実に発火させる
         （rAF はバックグラウンドタブで止まるため使わない） */
      void el.offsetWidth;
      setTimeout(function () { el.classList.add('is-visible'); }, 30);
    }

    function onScroll() {
      if (window.scrollY > Math.max(700, window.innerHeight * 0.9)) show();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    setTimeout(show, 1400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupMobileMenu();
      setupCurrentNav();
      setupTopFeatureSwitcher();
      setupCheckPromo();
    });
  } else {
    setupMobileMenu();
    setupCurrentNav();
    setupTopFeatureSwitcher();
    setupCheckPromo();
  }
})();
