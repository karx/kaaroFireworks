// Kaaro Fireworks: personalized Diwali links + "Send a Diwali link" share panel.
// URL params (all optional, read client-side only):
//   from = sender name(s)          e.g. from=Kartik
//   to   = co-sender ("& Arshi")   e.g. from=Kartik&to=Arshi -> "Happy Diwali from Kartik & Arshi"
//   for  = recipient               e.g. for=Nani -> "Dear Nani,"
//   msg  = the text that lights up the sky as a firework burst (and the overlay quote).
//          Fireworks text is capped at SKY_MAX graphemes for legibility; longer messages still show in full
//          (up to 120) in the greeting overlay. With no msg the sky says "Happy Diwali" / "शुभ दीपावली".
//          Sender names are NEVER drawn in the fireworks, only in the overlay.
//   lang = en | hi                 (greeting language)
// Everything is rendered with textContent, never innerHTML. Unicode-safe (Hindi names work).
(function () {
  'use strict';

  var LIMITS = { from: 40, to: 40, for: 40, msg: 120 };
  var SKY_MAX = 28;   // graphemes that stay legible as particle text on a 390px-wide phone
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
    en: { happy: 'Happy Diwali', from: 'from', dear: 'Dear', amp: '&', wish: 'Shubh Deepavali 2026', sky: 'Happy Diwali' },
    hi: { happy: 'दिवाली की शुभकामनाएँ', from: '', dear: 'प्रिय', amp: 'और', wish: 'शुभ दीपावली 2026', sky: 'शुभ दीपावली' }
  };
  function senders(p, lang) {
    var t = T[lang || 'en'];
    if (p.from && p.to) return p.from + ' ' + t.amp + ' ' + p.to;
    return p.from || p.to || '';
  }
  function sentence(p) {
    var t = T[p.lang], who = senders(p, p.lang);
    if (!who) return t.happy;
    return p.lang === 'hi' ? who + ' की ओर से ' + t.happy : t.happy + ' ' + t.from + ' ' + who;
  }
  P.senders = senders(P, P.lang);
  P.greeting = sentence(P);
  // Text for the fireworks: the message, or a festive default. Never the sender's name.
  function skyText(msg, lang) {
    var m = clean(msg, LIMITS.msg).replace(/…$/, '');
    if (!m) return T[lang || 'en'].sky;
    var g = graphemes(m);
    if (g.length <= SKY_MAX) return m;
    var cut = g.slice(0, SKY_MAX).join('');
    var sp = cut.lastIndexOf(' ');
    return (sp >= 10 ? cut.slice(0, sp) : cut).trim();
  }
  P.skyText = skyText(P.msg, P.lang);
  P.burstText = P.skyText;           // back-compat alias
  P.active = !!(P.senders || P.msg);
  P.SKY_MAX = SKY_MAX;
  window.KF_PERSONAL = P;

  /* ---------- greeting overlay + title ---------- */
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  // Inline SVG icon from the page sprite (#i-*). No icon font, no runtime dependency.
  var SVGNS = 'http://www.w3.org/2000/svg';
  function icon(name) {
    var svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('class', 'kf-i'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    var use = document.createElementNS(SVGNS, 'use'); use.setAttribute('href', '#i-' + name); svg.appendChild(use); return svg;
  }
  function iconBtn(tag, cls, name, label) { var b = el(tag, cls); b.appendChild(icon(name)); if (label) b.appendChild(el('span', 'kf-lbl', label)); return b; }
  window.kfIcon = icon;

  function renderGreeting() {
    if (!P.active) return;
    document.title = P.greeting + ' 🪔 | Kaaro Fireworks';
    document.documentElement.lang = P.lang === 'hi' ? 'hi' : 'en-IN';
    var box = el('div', 'kf-greeting');
    box.setAttribute('role', 'status');
    if (P.for) box.appendChild(el('p', 'kf-greeting-dear', T[P.lang].dear + ' ' + P.for + ','));
    box.appendChild(el('p', 'kf-greeting-happy', T[P.lang].happy));
    if (P.senders) {
      var who = el('p', 'kf-greeting-from');
      who.textContent = P.lang === 'hi' ? P.senders + ' की ओर से' : 'from ' + P.senders;
      box.appendChild(who);
    }
    if (P.msg) box.appendChild(el('p', 'kf-greeting-msg', '“' + P.msg + '”'));
    box.appendChild(el('p', 'kf-greeting-wish', T[P.lang].wish));
    document.body.appendChild(box);
    // Let the show breathe: dim the card after a while, keep it readable on hover/focus.
    setTimeout(function () { box.classList.add('kf-greeting-dim'); }, REDUCE ? 4000 : 9000);
  }

  // Light up the sky with the message (classic particles; the 3D page renders the same particles in 3D).
  function skyBurst(delay) {
    if (!P.active || !window.launchTextFirework || !window.canvas) return;
    var text = P.skyText;
    var g = graphemes(text).length;
    setTimeout(function () {
      // read the canvas size at fire time (it is still 300x150 before the first resize)
      var W = window.canvas.width, H = window.canvas.height;
      // fit the sampled text to ~88% of the width (same font the sampler uses), so long / Devanagari names never overflow
      var mctx = document.createElement('canvas').getContext('2d');
      mctx.font = 'bold 100px Arial';
      var w100 = mctx.measureText(text).width || (g * 60);
      var fit = (!IS_3D && W >= 900) ? 0.72 : 0.88;   // keep clear of the desktop reel card
      var size = Math.max(24, Math.min(130, Math.floor(100 * (W * fit) / w100)));
      launchSky(text, W / 2, H * (IS_3D ? 0.5 : 0.52), { fontSize: size, color: '#ffcf6b', spread: 0.6 });
    }, delay);
  }
  // 2D page: text particles spawn staggered over ~2s and fade in ~1s by default, so the message never reads at once.
  // Slow their fade and gravity for the length of the sky burst (the 3D module does the same for its renderer).
  var skyUntil = 0;
  if (!IS_3D && window.Particle && window.Particle.prototype.init) {
    var baseInit = window.Particle.prototype.init;
    window.Particle.prototype.init = function (x, y, color, vx, vy, o) {
      baseInit.apply(this, arguments);
      if (Date.now() < skyUntil && o && o.trail === false && o.colorTransition === false) {
        this.decay = 0.006 + Math.random() * 0.003;
        this.customGravity = (window.config ? window.config.gravity : 0.1) * 0.05;
        this.size = 1.1 + Math.random() * 0.9;   // finer dots keep small / Devanagari glyphs readable
      }
    };
  }
  var launchSky = function (text, x, y, opts) {
    skyUntil = Date.now() + 6000;   // covers rocket flight + staggered spawn
    // Fly the rocket straight up under the target so the message is centred
    // (launchTextFirework starts from a random x and bursts off-centre).
    var FW = typeof Firework === 'function' ? Firework : null;   // classic global from fireworks.js
    if (!FW || !window.fireworks || !window.createTextExplosion) { window.launchTextFirework(text, x, y, opts); return; }
    var fw = new FW(x, window.canvas.height, x, y);
    window.fireworks.push(fw);
    var iv = setInterval(function () {
      if (fw.distanceTraveled >= fw.distanceToTarget * 0.9) {
        clearInterval(iv);
        var i = window.fireworks.indexOf(fw); if (i > -1) window.fireworks.splice(i, 1);
        window.createTextExplosion(text, x, fw.y, opts);
      }
    }, 16);
  };
  window.kfSkyBurst = skyBurst;
  window.kfNameBurst = skyBurst;   // old name, kept for callers

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
    var btn = iconBtn('button', 'btn-primary kf-btn kf-btn-accent kf-greet-btn', 'send', 'Send wishes');
    btn.type = 'button'; btn.id = 'greetToggle';
    btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'greetPanel');
    btn.setAttribute('aria-label', 'Send a personalised Diwali link');
    controls.insertBefore(btn, controls.children[1] || null);

    var panel = el('div', 'settings-panel kf-greet-panel hidden');
    panel.id = 'greetPanel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'greetTitle');
    var head = el('div', 'panel-header');
    var h = el('h3', null, 'Send a Diwali link'); h.id = 'greetTitle';
    var close = iconBtn('button', 'panel-close', 'x'); close.type = 'button'; close.setAttribute('aria-label', 'Close');
    head.appendChild(h); head.appendChild(close); panel.appendChild(head);

    var body = el('div', 'kf-greet-body');
    var fFrom = field('greetFrom', 'Your name', { placeholder: 'e.g. Kartik or कार्तिक', max: LIMITS.from, autocomplete: 'given-name' });
    var fTo = field('greetTo', 'With (optional)', { placeholder: 'e.g. Arshi', max: LIMITS.to, hint: 'Shows as “Happy Diwali from Kartik & Arshi”.' });
    var fFor = field('greetFor', 'For (optional)', { placeholder: 'e.g. Nani', max: LIMITS.for });
    var fMsg = field('greetMsg', 'Sky message', { placeholder: 'Roshni Mubarak', max: SKY_MAX * 4, autocomplete: 'off',
      hint: 'This is the text that lights up the sky as fireworks. Leave empty for “Happy Diwali”.' });
    fMsg.wrap.classList.add('kf-field-sky');
    var count = el('span', 'kf-count'); count.id = 'greetMsgCount'; count.setAttribute('aria-live', 'polite');
    fMsg.wrap.querySelector('label').appendChild(count);
    var row = el('div', 'kf-row');
    var fLang = field('greetLang', 'Language', { tag: 'select', options: [['en', 'English'], ['hi', 'हिंदी']] });
    var fPage = field('greetPage', 'Open as', { tag: 'select', options: [['3d', '3D show'], ['2d', 'Classic']] });
    row.appendChild(fLang.wrap); row.appendChild(fPage.wrap);
    [fMsg, fFrom, fTo, fFor].forEach(function (f) { body.appendChild(f.wrap); });
    body.appendChild(row);

    var prevLabel = el('label', null, 'Your link'); prevLabel.htmlFor = 'greetURL';
    var prev = el('output', 'kf-url'); prev.id = 'greetURL'; prev.setAttribute('aria-live', 'polite');
    var prevWrap = el('div', 'kf-field'); prevWrap.appendChild(prevLabel); prevWrap.appendChild(prev);
    body.appendChild(prevWrap);

    var actions = el('div', 'kf-actions');
    var bCopy = iconBtn('button', 'action-btn kf-copy', 'link', 'Copy link'); bCopy.type = 'button';
    var bShare = iconBtn('button', 'action-btn kf-native', 'share', 'Share'); bShare.type = 'button';
    var bWa = iconBtn('a', 'action-btn kf-wa', 'chat', 'WhatsApp'); bWa.target = '_blank'; bWa.rel = 'noopener noreferrer';
    actions.appendChild(bCopy); if (navigator.share) actions.appendChild(bShare); actions.appendChild(bWa);
    body.appendChild(actions);
    var status = el('p', 'kf-status'); status.setAttribute('role', 'status'); body.appendChild(status);
    panel.appendChild(body);
    document.body.appendChild(panel);

    fFrom.input.value = P.from || load(STORE_FROM);
    fTo.input.value = P.from ? P.to : (P.to || load(STORE_TO));
    fLang.input.value = P.lang;
    if (P.msg) fMsg.input.value = skyText(P.msg, P.lang);
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
      // cap by grapheme (maxLength counts UTF-16 units, which would cut Devanagari short)
      var gm = graphemes(fMsg.input.value);
      if (gm.length > SKY_MAX) { fMsg.input.value = gm.slice(0, SKY_MAX).join(''); v.msg = fMsg.input.value; }
      var n = graphemes(clean(v.msg, LIMITS.msg)).length;
      count.textContent = n + '/' + SKY_MAX;
      count.classList.toggle('is-near', n >= SKY_MAX - 4);
      fMsg.input.placeholder = v.lang === 'hi' ? 'रोशनी मुबारक' : 'Roshni Mubarak';
      var hint = document.getElementById('greetMsgHint');
      if (hint) hint.textContent = 'This is the text that lights up the sky as fireworks. Leave empty for “' + T[v.lang === 'hi' ? 'hi' : 'en'].sky + '”.';
      var ok = !!clean(v.from, 40);
      bCopy.disabled = !ok; bShare.disabled = !ok;
      bWa.setAttribute('aria-disabled', ok ? 'false' : 'true'); bWa.classList.toggle('is-disabled', !ok);
      status.textContent = ok ? '' : 'Add your name to make it personal.';
      store(STORE_FROM, clean(v.from, 40)); store(STORE_TO, clean(v.to, 40));
    }
    [fFrom, fTo, fFor, fMsg, fLang, fPage].forEach(function (f) { f.input.addEventListener('input', update); f.input.addEventListener('change', update); });
    bWa.addEventListener('click', function (e) { if (bWa.classList.contains('is-disabled')) { e.preventDefault(); fFrom.input.focus(); } else { var A = window.analytics; A && A.trackShareURLGenerate('send_wishes', 'whatsapp'); } });

    bCopy.addEventListener('click', function () {
      var url = currentURL;
      var done = function () { status.textContent = 'Link copied. Paste it anywhere.'; var A = window.analytics; if (A) { A.trackShareURLGenerate('send_wishes', 'copy'); A.trackShareURLCopy('send_wishes'); } };
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
      navigator.share({ title: 'Happy Diwali 2026', text: shareText(v), url: currentURL }).then(function () { var A = window.analytics; A && A.trackShareURLGenerate('send_wishes', 'native'); }, function () {});
    });

    var backdrop = document.getElementById('panelBackdrop');
    function open() {
      document.querySelectorAll('.settings-panel:not(.hidden)').forEach(function (p) { if (p !== panel) p.classList.add('hidden'); });
      panel.classList.remove('hidden'); btn.setAttribute('aria-expanded', 'true');
      if (backdrop) backdrop.classList.remove('hidden');
      update();
      window.analytics && window.analytics.trackMenuOpen('send_wishes');
      // Focus the first field (Sky message) synchronously. A deferred focus() used to land after the user
      // (or autofill / a test) had already started typing elsewhere and moved their keystrokes into "Your name".
      // Never pull focus away from a field the user is already in.
      if (!panel.contains(document.activeElement)) {
        try { fMsg.input.focus({ preventScroll: true }); } catch (e) { fMsg.input.focus(); }
        var n = fMsg.input.value.length; try { fMsg.input.setSelectionRange(n, n); } catch (e) {}
      }
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
      window.analytics && window.analytics.trackPersonalizedVisit(P.lang, !!P.msg);
      if (!IS_3D) skyBurst(1300);   // the 3D page triggers its own burst once the intro ends
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
