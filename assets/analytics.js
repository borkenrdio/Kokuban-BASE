/* GA4 journey measurement. Page views remain owned by the existing Google tag. */
(function () {
  'use strict';
  if (window.kbAnalyticsReady) return;
  window.kbAnalyticsReady = true;

  function pathOf(value) {
    if (!value) return '';
    try {
      var url = new URL(value, window.location.href);
      if (url.origin !== window.location.origin) return '';
      return url.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') + '/';
    } catch (error) { return ''; }
  }
  var current = pathOf(window.location.href);
  var previous = pathOf(document.referrer);
  // Only named, non-text parameters are accepted. Never inspect form field values.
  var allowed = ['brand', 'brand_second', 'tie', 'audience', 'result_size',
    'question_id', 'step_number', 'from_path', 'to_path', 'link_area', 'form_id'];
  window.kbTrack = function (name, params) {
    if (typeof window.gtag !== 'function') return;
    var safe = { page_path: current, transport_type: 'beacon' };
    allowed.forEach(function (key) {
      if (params && params[key] !== undefined) safe[key] = params[key];
    });
    window.gtag('event', name, safe);
  };

  function areaOf(link) {
    if (link.closest('.sticky-cta')) return 'sticky_cta';
    if (link.closest('.kb-checkfloat')) return 'diagnosis_popup';
    if (link.closest('header')) return 'header';
    if (link.closest('footer')) return 'footer';
    if (link.closest('aside')) return 'sidebar';
    return 'content';
  }
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link || event.defaultPrevented) return;
    var destination = pathOf(link.href);
    if (!destination || destination === current) return;
    var params = { from_path: current, to_path: destination, link_area: areaOf(link) };
    window.kbTrack('site_navigation', params);
    if (destination === '/contact/') window.kbTrack('contact_click', params);
  });

  if (current === '/check/') window.kbTrack('check_view', { from_path: previous });
  if (current === '/contact/') {
    window.kbTrack('contact_view', { from_path: previous });
    var started = false;
    var form = document.querySelector('#contactForm');
    if (form) form.addEventListener('input', function (event) {
      if (started || !event.isTrusted || !event.target.matches('input:not([type="hidden"]), textarea, select')) return;
      started = true;
      window.kbTrack('contact_start', { form_id: 'contact' });
    });
  }
})();
