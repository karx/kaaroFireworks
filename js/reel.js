// "Watch the reel" for the landing page. Config lives on #kfReel data attributes;
// with no data-src the section stays hidden (never fakes a video).
(function () {
  'use strict';
  var cfg = document.getElementById('kfReel');
  if (!cfg) return;
  var src = cfg.getAttribute('data-src'), loop = cfg.getAttribute('data-loop'), poster = cfg.getAttribute('data-poster'),
      loopPoster = cfg.getAttribute('data-loop-poster') || poster, title = cfg.getAttribute('data-title') || 'Watch the reel',
      size = cfg.getAttribute('data-size') || '';
  if (!src) return;
  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(t, c, txt) { var n = document.createElement(t); if (c) n.className = c; if (txt != null) n.textContent = txt; return n; }
  function track(n) { try { window.plausible && window.plausible(n); } catch (e) {} }

  // Modal player (sound on, user-initiated).
  var modal = el('div', 'kf-reel-modal'); modal.hidden = true;
  modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'kfReelTitle');
  var sheet = el('div', 'kf-reel-sheet');
  var h = el('h2', null, title); h.id = 'kfReelTitle';
  var v = document.createElement('video');
  v.controls = true; v.playsInline = true; v.preload = 'none'; if (poster) v.poster = poster;
  v.setAttribute('aria-label', title);
  var s = document.createElement('source'); s.src = src; s.type = 'video/mp4'; v.appendChild(s);
  var actions = el('div', 'kf-reel-actions');
  var dl = el('a', null, '⬇ Download' + (size ? ' (' + size + ')' : '')); dl.href = src; dl.setAttribute('download', src.split('/').pop());
  dl.addEventListener('click', function () { track('Reel Download'); });
  var make = el('button', null, '💌 Send your own wishes'); make.type = 'button';
  make.addEventListener('click', function () { closeModal(); window.kfOpenGreetPanel && window.kfOpenGreetPanel(); });
  actions.appendChild(dl); actions.appendChild(make);
  var x = el('button', 'kf-reel-close', '✕'); x.type = 'button'; x.setAttribute('aria-label', 'Close reel');
  sheet.appendChild(x); sheet.appendChild(h); sheet.appendChild(v); sheet.appendChild(actions);
  modal.appendChild(sheet); document.body.appendChild(modal);

  var opener = null;
  function openModal(from) {
    opener = from || document.activeElement; modal.hidden = false; track('Reel Open');
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    x.focus();
  }
  function closeModal() { v.pause(); modal.hidden = true; if (opener && opener.focus) opener.focus(); }
  x.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') { // simple focus trap
      var f = Array.prototype.filter.call(modal.querySelectorAll('button,a,video'), function (n) { return n.offsetParent !== null; });
      if (!f.length) return; var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Desktop hero loop: muted, inline, autoplay-friendly; paused for reduced motion.
  var card = el('button', 'kf-reel-card'); card.type = 'button'; card.setAttribute('aria-label', title + ' (opens player)');
  var lv = document.createElement('video');
  lv.muted = true; lv.defaultMuted = true; lv.loop = true; lv.playsInline = true; lv.setAttribute('playsinline', ''); lv.setAttribute('muted', '');
  lv.preload = 'metadata'; lv.setAttribute('aria-hidden', 'true'); lv.tabIndex = -1;
  if (loopPoster) lv.poster = loopPoster;
  if (!REDUCE) lv.autoplay = true;
  var ls = document.createElement('source'); ls.src = loop || src; ls.type = 'video/mp4'; lv.appendChild(ls);
  card.appendChild(lv); card.appendChild(el('span', 'kf-reel-tag', '▶ ' + title));
  card.addEventListener('click', function () { openModal(card); });
  document.body.appendChild(card);

  // Mobile: compact pill next to the 3D CTA.
  var cta = document.getElementById('cta3d');
  if (cta) {
    var pill = el('button', 'kf-reel-pill', '▶ Reel'); pill.type = 'button'; pill.setAttribute('aria-label', title);
    pill.addEventListener('click', function () { openModal(pill); });
    cta.insertBefore(pill, cta.firstChild);
  }
  window.kfOpenReel = openModal;
})();
