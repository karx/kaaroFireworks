// Track clicks on the "Watch the reel · @kaaroclick" link (RFC R-AN-5). The Plausible pa-*.js snippet also
// records "Outbound Link: Click" with a url prop automatically (outbound links are enabled in the site's script).
(function () {
  'use strict';
  var a = document.getElementById('reelLink');
  if (!a) return;
  a.addEventListener('click', function () {
    try { window.analytics && window.analytics.trackReelLinkClick(a.getAttribute('data-placement') || 'footer'); } catch (e) {}
  });
  // Floating placement only: show for ~3.5s, then fade out and stay gone for the session.
  if (a.classList.contains('kf-ig-float')) {
    setTimeout(function () {
      a.classList.add('is-faded');
      setTimeout(function () { a.style.display = 'none'; }, 900);
    }, 3500);
  }
})();
