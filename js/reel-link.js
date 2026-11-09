// Track clicks on the "Watch the reel · @kaaroclick" link (RFC R-AN-5). The Plausible pa-*.js snippet also
// records "Outbound Link: Click" with a url prop automatically (outbound links are enabled in the site's script).
(function () {
  'use strict';
  var a = document.getElementById('reelLink');
  if (!a) return;
  a.addEventListener('click', function () {
    try { window.analytics && window.analytics.trackReelLinkClick(a.getAttribute('data-placement') || 'footer'); } catch (e) {}
  });
})();
