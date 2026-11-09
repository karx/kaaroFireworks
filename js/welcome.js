// First-visit welcome on / (RFC R-UX-1): "Tap anywhere to light a pataka".
// - Shown once per browser (localStorage "pataka_seen"); the first tap/click/key dismisses it.
// - The overlay is pointer-events:none, so that same tap reaches the canvas and launches a firework.
// - Fixed-position, so it never shifts layout.
// - Personalised links (?from / ?msg ...) already show the greeting card from personalize.js; in that case we
//   don't stack a second overlay, we add the one-line tap hint to the greeting card instead.
(function () {
  'use strict';
  var KEY = 'pataka_seen';
  function seen() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function markSeen() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
  if (seen()) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  function tapIcon() {
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'kf-welcome-ico');
    var p = document.createElementNS(SVGNS, 'path');
    // a spark: centre dot + 8 rays (sharp, no fill)
    p.setAttribute('d', 'M12 2v5M12 17v5M2 12h5M17 12h5M4.9 4.9l3.5 3.5M15.6 15.6l3.5 3.5M4.9 19.1l3.5-3.5M15.6 8.4l3.5-3.5M11 11h2v2h-2z');
    svg.appendChild(p); return svg;
  }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function hint() { var h = el('p', 'kf-welcome-hint'); h.appendChild(tapIcon()); h.appendChild(el('span', null, 'Tap anywhere to light a pataka')); return h; }

  function start() {
    var personal = window.KF_PERSONAL && window.KF_PERSONAL.active;
    var node;
    if (personal) {
      var card = document.querySelector('.kf-greeting');
      if (!card) { markSeen(); return; }
      node = hint(); node.classList.add('kf-welcome-inline');
      card.appendChild(node);
    } else {
      node = el('div', 'kf-welcome');
      node.setAttribute('role', 'status');
      node.appendChild(el('p', 'kf-welcome-eyebrow', 'Shubh Deepavali 2026'));
      node.appendChild(el('h2', 'kf-welcome-title', 'Happy Diwali from the Arora family'));
      node.appendChild(hint());
      var a = el('a', 'kf-welcome-link', 'or watch the ASCII → 3D show');
      a.href = 'ascii-to-3d.html';
      a.addEventListener('click', function () { try { window.analytics && window.analytics.track('welcome_3d_click'); } catch (e) {} });
      node.appendChild(a);
      document.body.appendChild(node);
    }
    var done = false;
    function dismiss(e) {
      if (done) return;
      if (e && e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return;  // keyboard users can still tab to the link
      done = true;
      markSeen();
      window.removeEventListener('pointerdown', dismiss, true);
      window.removeEventListener('keydown', dismiss, true);
      node.classList.add('kf-welcome-out');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 450);
    }
    // capture phase + passive: we never stop the event, so the canvas still gets the tap and fires a pataka
    window.addEventListener('pointerdown', dismiss, { capture: true, passive: true });
    window.addEventListener('keydown', dismiss, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
