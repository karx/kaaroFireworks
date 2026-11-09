// Kaaro Fireworks: personalized Diwali links + "Send a Diwali link" share panel.
// URL params (all optional, read client-side only):
//   from = sender name(s)          e.g. from=Kartik
//   to   = co-sender ("& Arshi")   e.g. from=Kartik&to=Arshi -> "Happy Diwali from Kartik & Arshi"
//   for  = recipient               e.g. for=Nani -> "Dear Nani,"
//   msg  = short personal line     (max 120 characters)
//   lang = en | hi                 (greeting language)
// Everything is rendered with textContent, never innerHTML. Unicode-safe (Hindi names work).
(function () {
  'use strict';

  var LIMITS = { from: 40, to: 40, for: 40, msg: 120 };
  var STORE_FROM = 'kf-greet-from', STORE_TO = 'kf-greet-to';
  var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IS_3D = /ascii-to-3d/.test(location.pathname);

  var seg = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  function graphemes(s) { return seg ? Array.from(seg.segment(s), function (x) { return x.segment; }) : Array.from(s); }

  // Strip control, format (bidi overrides, zero-width tricks other than ZWJ/ZWNJ used by Indic scripts),
  // and angle brackets; collapse whitespace; cap by grapheme count so Devanagari clusters never split.
  function clean(v, max) {
    if (v == null) return '';
    var s = String(v);
    try { s = s.normalize('NFC'); } catch (e) {}
    s = s.replace(/[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF<>]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    var g = graphemes(s);
    if (g.length > max) s = g.slice(0, max).join('').trim() + '…';
    return s;
  }

  var q = new URLSearchParams(location.search);
  var P = {
    from: clean(q.get('from'), LIMITS.from),
    to: clean(q.get('to'), LIMITS.to),
    for: clean(q.get('for'), LIMITS.for),
    msg: clean(q.get('msg'), LIMITS.msg),
    lang: q.get('lang') === 'hi' ? 'hi' : 'en'
  };
  var T = {
    en: { happy: 'Happy Diwali', from: 'from', dear: 'Dear', amp: '&', wish: 'Shubh Deepavali 2026 🪔' },
    hi: { happy: 'दिवाली की शुभकामनाएँ', from: '', dear: 'प्रिय', amp: 'और', wish: 'शुभ दीपावली 2026 🪔' }
  };
  function senders(p, lang) {
    var t = T[lang || 'en'];
    if (p.from && p.to) return p.from + ' ' + t.amp + ' ' + p.to;
    return p.from || p.to || '';
  }
  function sentence(p) {
    var t = T[p.lang], who = senders(p, p.lang);
    if (!who) return '';
    return p.lang === 'hi' ? who + ' की ओर से ' + t.happy : t.happy + ' ' + t.from + ' ' + who;
  }
  P.senders = senders(P, P.lang);
  P.greeting = sentence(P);
  P.burstText = senders(P, 'en') ? (P.from && P.to ? P.from + ' & ' + P.to : P.senders) : '';
  P.active = !!P.senders;
  window.KF_PERSONAL = P;

  /* ---------- greeting overlay + title ---------- */
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  function renderGreeting() {
    if (!P.active) return;
    document.title = P.greeting + ' 🪔 | Kaaro Fireworks';
    document.documentElement.lang = P.lang === 'hi' ? 'hi' : 'en-IN';
    var box = el('div', 'kf-greeting');
    box.setAttribute('role', 'status');
    if (P.for) box.appendChild(el('p', 'kf-greeting-dear', T[P.lang].dear + ' ' + P.for + ','));
    box.appendChild(el('p', 'kf-greeting-happy', T[P.lang].happy));
    var who = el('p', 'kf-greeting-from');
    who.textContent = P.lang === 'hi' ? P.senders + ' की ओर से' : 'from ' + P.senders;
    box.appendChild(who);
    if (P.msg) box.appendChild(el('p', 'kf-greeting-msg', '“' + P.msg + '”'));
    box.appendChild(el('p', 'kf-greeting-wish', T[P.lang].wish));
    document.body.appendChild(box);
    // Let the show breathe: dim the card after a while, keep it readable on hover/focus.
    setTimeout(function () { box.classList.add('kf-greeting-dim'); }, REDUCE ? 4000 : 9000);
  }

  // Spell the names in fireworks (classic particles; the 3D page renders the same particles in 3D).
  function nameBurst(delay) {
    if (!P.active || !window.launchTextFirework || !window.canvas) return;
    var text = P.burstText;
    var g = graphemes(text).length;
    setTimeout(function () {
      // read the canvas size at fire time (it is still 300x150 before the first resize)
      var W = window.canvas.width, H = window.canvas.height;
      // fit the sampled text to ~88% of the width (same font the sampler uses), so long / Devanagari names never overflow
      var mctx = document.createElement('canvas').getContext('2d');
      mctx.font = 'bold 100px Arial';
      var w100 = mctx.measureText(text).width || (g * 60);
      var size = Math.max(24, Math.min(130, Math.floor(100 * (W * 0.88) / w100)));
      window.launchTextFirework(text, W / 2, H * (IS_3D ? 0.5 : 0.52), { fontSize: size, color: '#ffcf6b', spread: 0.6 });
    }, delay);
  }
  window.kfNameBurst = nameBurst;

  /* ---------- share panel ---------- */
  function buildURL(v) {
    var base = location.origin + (v.page === '3d' ? '/ascii-to-3d.html' : '/');
    var sp = new URLSearchParams();
    ['from', 'to', 'for', 'msg'].forEach(function (k) { var c = clean(v[k], LIMITS[k]); if (c) sp.set(k, c); });
    if (v.lang === 'hi') sp.set('lang', 'hi');
    var s = sp.toString();
    return base + (s ? '?' + s : '');
  }
  function store(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }

  function field(id, label, opts) {
    var wrap = el('div', 'kf-field');
    var l = el('label', null, label); l.htmlFor = id;
    var i = document.createElement(opts.tag || 'input');
    i.id = id; i.className = 'kf-input';
    if (opts.type) i.type = opts.type;
    if (opts.placeholder) i.placeholder = opts.placeholder;
    if (opts.max) i.maxLength = opts.max;
    if (opts.autocomplete) i.autocomplete = opts.autocomplete;
    if (opts.options) opts.options.forEach(function (o) { var op = el('option', null, o[1]); op.value = o[0]; i.appendChild(op); });
    wrap.appendChild(l); wrap.appendChild(i);
    if (opts.hint) { var h = el('p', 'kf-hint', opts.hint); h.id = id + 'Hint'; i.setAttribute('aria-describedby', h.id); wrap.appendChild(h); }
    return { wrap: wrap, input: i };
  }

  function buildSharePanel() {
    var controls = document.querySelector('.controls');
    if (!controls) return;
    var btn = el('button', 'btn-primary kf-greet-btn');
    btn.type = 'button'; btn.id = 'greetToggle';
    btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'greetPanel');
    btn.setAttribute('aria-label', 'Send a personalised Diwali link');
    btn.appendChild(el('span', 'kf-greet-ico', '💌')); btn.appendChild(el('span', 'kf-greet-lbl', 'Send wishes'));
    controls.insertBefore(btn, controls.children[1] || null);

    var panel = el('div', 'settings-panel kf-greet-panel hidden');
    panel.id = 'greetPanel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'greetTitle');
    var head = el('div', 'panel-header');
    var h = el('h3', null, 'Send a Diwali link'); h.id = 'greetTitle';
    var close = el('button', 'panel-close', '✕'); close.type = 'button'; close.setAttribute('aria-label', 'Close');
    head.appendChild(h); head.appendChild(close); panel.appendChild(head);

    var body = el('div', 'kf-greet-body');
    var fFrom = field('greetFrom', 'Your name', { placeholder: 'e.g. Kartik or कार्तिक', max: LIMITS.from, autocomplete: 'given-name' });
    var fTo = field('greetTo', 'With (optional)', { placeholder: 'e.g. Arshi', max: LIMITS.to, hint: 'Shows as “Happy Diwali from Kartik & Arshi”.' });
    var fFor = field('greetFor', 'For (optional)', { placeholder: 'e.g. Nani', max: LIMITS.for });
    var fMsg = field('greetMsg', 'Message (optional)', { placeholder: 'Roshni aur mithaas bhari ho!', max: LIMITS.msg });
    var row = el('div', 'kf-row');
    var fLang = field('greetLang', 'Language', { tag: 'select', options: [['en', 'English'], ['hi', 'हिंदी']] });
    var fPage = field('greetPage', 'Open as', { tag: 'select', options: [['3d', '3D show'], ['2d', 'Classic']] });
    row.appendChild(fLang.wrap); row.appendChild(fPage.wrap);
    [fFrom, fTo, fFor, fMsg].forEach(function (f) { body.appendChild(f.wrap); });
    body.appendChild(row);

    var prevLabel = el('label', null, 'Your link'); prevLabel.htmlFor = 'greetURL';
    var prev = el('output', 'kf-url'); prev.id = 'greetURL'; prev.setAttribute('aria-live', 'polite');
    var prevWrap = el('div', 'kf-field'); prevWrap.appendChild(prevLabel); prevWrap.appendChild(prev);
    body.appendChild(prevWrap);

    var actions = el('div', 'kf-actions');
    var bCopy = el('button', 'action-btn kf-copy', '🔗 Copy link'); bCopy.type = 'button';
    var bShare = el('button', 'action-btn kf-native', '📲 Share…'); bShare.type = 'button';
    var bWa = el('a', 'action-btn kf-wa', '🟢 WhatsApp'); bWa.target = '_blank'; bWa.rel = 'noopener noreferrer';
    actions.appendChild(bCopy); if (navigator.share) actions.appendChild(bShare); actions.appendChild(bWa);
    body.appendChild(actions);
    var status = el('p', 'kf-status'); status.setAttribute('role', 'status'); body.appendChild(status);
    panel.appendChild(body);
    document.body.appendChild(panel);

    fFrom.input.value = P.from || load(STORE_FROM);
    fTo.input.value = P.from ? P.to : (P.to || load(STORE_TO));
    fLang.input.value = P.lang;
    fPage.input.value = '3d';

    var currentURL = '';
    function values() { return { from: fFrom.input.value, to: fTo.input.value, for: fFor.input.value, msg: fMsg.input.value, lang: fLang.input.value, page: fPage.input.value }; }
    function shareText(v) {
      var who = senders({ from: clean(v.from, 40), to: clean(v.to, 40) }, 'en');
      return who ? '🪔 Happy Diwali from ' + who + '! Tap to light up the sky:' : '🪔 Happy Diwali! Tap to light up the sky:';
    }
    function update() {
      var v = values(), url = buildURL(v);
      currentURL = url;
      var shown = url; try { shown = decodeURI(url); } catch (e) {}
      prev.textContent = shown;   // readable (Hindi stays Hindi); copy/share use the encoded URL
      bWa.href = 'https://wa.me/?text=' + encodeURIComponent(shareText(v) + ' ' + url);
      var ok = !!clean(v.from, 40);
      bCopy.disabled = !ok; bShare.disabled = !ok;
      bWa.setAttribute('aria-disabled', ok ? 'false' : 'true'); bWa.classList.toggle('is-disabled', !ok);
      status.textContent = ok ? '' : 'Add your name to make it personal.';
      store(STORE_FROM, clean(v.from, 40)); store(STORE_TO, clean(v.to, 40));
    }
    [fFrom, fTo, fFor, fMsg, fLang, fPage].forEach(function (f) { f.input.addEventListener('input', update); f.input.addEventListener('change', update); });
    bWa.addEventListener('click', function (e) { if (bWa.classList.contains('is-disabled')) { e.preventDefault(); fFrom.input.focus(); } else track('Share WhatsApp'); });

    bCopy.addEventListener('click', function () {
      var url = currentURL;
      var done = function () { status.textContent = 'Link copied. Paste it anywhere ✨'; track('Share Copy'); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, fallback); else fallback();
      function fallback() {
        var ta = document.createElement('textarea'); ta.value = url; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { status.textContent = 'Copy failed. Long-press the link above to copy.'; }
        ta.remove();
      }
    });
    bShare.addEventListener('click', function () {
      var v = values();
      navigator.share({ title: 'Happy Diwali 2026', text: shareText(v), url: currentURL }).then(function () { track('Share Native'); }, function () {});
    });

    var backdrop = document.getElementById('panelBackdrop');
    function open() {
      document.querySelectorAll('.settings-panel:not(.hidden)').forEach(function (p) { if (p !== panel) p.classList.add('hidden'); });
      panel.classList.remove('hidden'); btn.setAttribute('aria-expanded', 'true');
      if (backdrop) backdrop.classList.remove('hidden');
      update(); setTimeout(function () { fFrom.input.focus(); }, 30);
    }
    function shut(returnFocus) {
      panel.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false');
      if (backdrop && !document.querySelector('.settings-panel:not(.hidden)')) backdrop.classList.add('hidden');
      if (returnFocus) btn.focus();
    }
    btn.addEventListener('click', function () { panel.classList.contains('hidden') ? open() : shut(); });
    close.addEventListener('click', function () { shut(true); });
    if (backdrop) backdrop.addEventListener('click', function () { shut(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.classList.contains('hidden')) shut(true); });
    window.kfOpenGreetPanel = open;
    update();
  }

  function track(name) { try { if (window.plausible) window.plausible(name); } catch (e) {} }

  function syncReducedMotion() {
    var on = REDUCE || !!(window.performanceConfig && window.performanceConfig.reducedMotion);
    document.body.classList.toggle('reduced-motion', on);
  }
  function init() {
    syncReducedMotion();
    var rm = document.getElementById('reducedMotion'); if (rm) rm.addEventListener('change', function () { setTimeout(syncReducedMotion, 0); });
    buildSharePanel();
    renderGreeting();
    if (P.active) {
      track('Personalized Visit');
      if (!IS_3D) nameBurst(1300);   // the 3D page triggers its own burst once the intro ends
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
