// Diwali variation: ASCII patakas -> 3D particles -> photoreal render.
const pre = document.getElementById('ascii');
const caption = document.getElementById('caption');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const ASCII_MS = 6500;

let COLS, ROWS, grid, ents, t0, raf, phase;
const PAL = ['#ffcf6b', '#ff8a3d', '#ff5fb4', '#9fe8ff', '#b6ff8a', '#fff3c4'];
const DIYA = ['  (  ', ' _)_ ', '\\___/'];

function size() {
  const w = innerWidth, h = innerHeight;
  const fs = parseFloat(getComputedStyle(pre).fontSize);
  COLS = Math.min(140, Math.max(40, Math.floor(w / (fs * 0.62))));
  ROWS = Math.min(60, Math.max(24, Math.floor((h * 0.82) / (fs * 1.05))));
}
const blank = () => Array.from({ length: ROWS }, () => Array(COLS).fill(' '));
function put(x, y, c) { x |= 0; y |= 0; if (y >= 0 && y < ROWS && x >= 0 && x < COLS) grid[y][x] = c; }

function initScene() {
  size(); ents = []; t0 = performance.now();
  const n = Math.max(3, Math.floor(COLS / 14));
  for (let i = 0; i < n; i++) ents.push({ k: 'diya', x: Math.round((i + 0.5) * COLS / n) - 2 });
  ents.push({ k: 'anar', x: Math.round(COLS * 0.22), sparks: [] });
  ents.push({ k: 'chakri', x: Math.round(COLS * 0.75), y: ROWS - 6, a: 0 });
}
const fl = () => '()'[Math.random() * 2 | 0];

function step(dt, t) {
  grid = blank();
  // stars
  for (let i = 0; i < COLS * 0.4; i++) { const s = (i * 9301 + 49297) % 233280; if (((t / 400 + i) | 0) % 7) put(s % COLS, (s >> 3) % (ROWS / 2), '.'); }
  if (Math.random() < dt * 0.0012) ents.push({ k: 'rocket', x: 6 + Math.random() * (COLS - 12), y: ROWS - 4, vy: -(18 + Math.random() * 10), top: 3 + Math.random() * ROWS * 0.35 });
  const ground = ROWS - 3;
  for (const e of ents) {
    if (e.k === 'diya') { DIYA.forEach((row, r) => [...row].forEach((c, j) => c !== ' ' && put(e.x + j, ground + r, r === 0 ? fl() : c))); }
    if (e.k === 'anar') {
      put(e.x - 1, ground + 1, '/'); put(e.x, ground + 1, '#'); put(e.x + 1, ground + 1, '\\'); put(e.x - 2, ground + 2, '/'); put(e.x + 2, ground + 2, '\\'); put(e.x - 1, ground + 2, '#'); put(e.x, ground + 2, '#'); put(e.x + 1, ground + 2, '#');
      for (let i = 0; i < 4; i++) e.sparks.push({ x: e.x, y: ground, vx: (Math.random() - .5) * 10, vy: -(14 + Math.random() * 14), l: 1.6 });
      e.sparks = e.sparks.filter(s => (s.l -= dt / 1000) > 0);
      for (const s of e.sparks) { s.vy += 22 * dt / 1000; s.x += s.vx * dt / 1000; s.y += s.vy * dt / 1000; put(s.x, s.y, s.l > 1.1 ? '*' : s.l > .5 ? '+' : '.'); }
    }
    if (e.k === 'chakri') {
      e.a += dt / 90; put(e.x, e.y, '@');
      for (let r = 1; r <= 3; r++) for (let j = 0; j < 4; j++) { const a = e.a + j * Math.PI / 2 + r * .5; put(e.x + Math.cos(a) * r * 2, e.y + Math.sin(a) * r, r === 3 ? '*' : '~'); }
    }
    if (e.k === 'rocket') {
      e.y += e.vy * dt / 1000; put(e.x, e.y, '^'); put(e.x, e.y + 1, '|'); put(e.x, e.y + 2, ':'); put(e.x, e.y + 3, '.');
      if (e.y <= e.top) { e.dead = true; ents.push({ k: 'burst', x: e.x, y: e.y, r: 0, ch: '*o+x#@'[Math.random() * 6 | 0] }); }
    }
    if (e.k === 'burst') {
      e.r += dt / 70; const R = e.r;
      for (let j = 0; j < 22; j++) { const a = j / 22 * Math.PI * 2; put(e.x + Math.cos(a) * R * 2, e.y + Math.sin(a) * R + R * R * .02, R > 9 ? '.' : R > 6 ? '+' : e.ch); }
      if (R > 12) e.dead = true;
    }
  }
  ents = ents.filter(e => !e.dead);
  // banner
  const msg = 'S H U B H   D E E P A V A L I';
  if (t > 1200) [...msg].forEach((c, i) => i < (t - 1200) / 60 && put((COLS - msg.length) / 2 + i, Math.floor(ROWS * .55), c));
  pre.textContent = grid.map(r => r.join('')).join('\n');
}

function asciiLoop(now) {
  const t = now - t0, dt = Math.min(50, now - (asciiLoop.last || now)); asciiLoop.last = now;
  step(dt, t);
  if (t > ASCII_MS && !params.has('hold')) return toThreeD();
  raf = requestAnimationFrame(asciiLoop);
}

// Read lit cells out of the current ASCII frame (in screen pixels) so particles start where glyphs are.
function glyphPoints() {
  const r = pre.getBoundingClientRect();
  const lines = pre.textContent.split('\n');
  const cw = r.width / COLS, ch = r.height / lines.length, pts = [];
  // measure actual text box
  const range = document.createRange(); range.selectNodeContents(pre); const tb = range.getBoundingClientRect();
  const cw2 = tb.width / COLS || cw, ch2 = tb.height / lines.length || ch;
  lines.forEach((l, y) => [...l].forEach((c, x) => { if (c !== ' ') pts.push([tb.left + (x + .5) * cw2, tb.top + (y + .5) * ch2, c]); }));
  return pts;
}

let three = null;
async function toThreeD() {
  if (phase === '3d') return; phase = '3d';
  cancelAnimationFrame(raf);
  caption.textContent = 'Dissolving into 3D…';
  const pts = glyphPoints();
  document.body.classList.add('dissolve');
  if (reduce) { setTimeout(showPhoto, 300); return; }
  try { three = three || await import('three'); } catch { showPhoto(); return; }
  runGL(pts);
  setTimeout(showPhoto, 1800);
}
function showPhoto() {
  document.body.classList.add('photo');
  caption.textContent = 'Hyperreal Deepavali: AI-generated photoreal render with live 3D sparks';
}

let gl;
function runGL(seed) {
  const T = three, canvas = document.getElementById('gl');
  if (gl) { gl.stop(); }
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight, false);
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
  cam.position.set(0, 0, 60);
  const MAX = 9000, pos = new Float32Array(MAX * 3), col = new Float32Array(MAX * 3), vel = new Float32Array(MAX * 3), life = new Float32Array(MAX);
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3));
  // soft round sprite
  const c2 = document.createElement('canvas'); c2.width = c2.height = 64; const g = c2.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(.25, '#fff8'); gr.addColorStop(1, '#0000'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const mat = new T.PointsMaterial({ size: 1.1, map: new T.CanvasTexture(c2), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
  scene.add(new T.Points(geo, mat));
  let n = 0; const tmp = new T.Color();
  const add = (x, y, z, vx, vy, vz, hex, l) => { const i = n++ % MAX; pos.set([x, y, z], i * 3); vel.set([vx, vy, vz], i * 3); tmp.set(hex); col.set([tmp.r, tmp.g, tmp.b], i * 3); life[i] = l; };
  // unproject screen glyph positions onto z=0 plane
  const hH = Math.tan(T.MathUtils.degToRad(27.5)) * 60, hW = hH * cam.aspect;
  for (const [sx, sy, c] of seed) {
    const x = (sx / innerWidth * 2 - 1) * hW, y = -(sy / innerHeight * 2 - 1) * hH;
    const hex = '*@#'.includes(c) ? '#ffcf6b' : '+x~'.includes(c) ? '#ff8a3d' : '()'.includes(c) ? '#ffe9a8' : /[A-Z]/.test(c) ? '#fff3c4' : PAL[Math.random() * PAL.length | 0];
    for (let k = 0; k < 3; k++) add(x, y, 0, (Math.random() - .5) * 6 + x * .15, (Math.random() - .5) * 6 + 2, Math.random() * 30 - 5, hex, 2 + Math.random() * 1.5);
  }
  const burst = () => {
    const x = (Math.random() - .5) * hW * 1.4, y = hH * (.1 + Math.random() * .6), z = -20 - Math.random() * 40, hex = PAL[Math.random() * PAL.length | 0], N = 260;
    for (let k = 0; k < N; k++) { const u = Math.random() * 2 - 1, th = Math.random() * 6.283, s = Math.sqrt(1 - u * u), sp = 14 + Math.random() * 4; add(x, y, z, s * Math.cos(th) * sp, u * sp, s * Math.sin(th) * sp, hex, 1.6 + Math.random()); }
  };
  let last = performance.now(), nextB = 900, alive = true, start = last;
  function loop(now) {
    if (!alive) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if ((nextB -= dt * 1000) < 0) { burst(); nextB = 700 + Math.random() * 1300; }
    for (let i = 0; i < MAX; i++) {
      if (life[i] <= 0) { pos[i * 3 + 2] = 1e4; continue; }
      life[i] -= dt; const f = Math.pow(.25, dt);
      vel[i * 3] *= f; vel[i * 3 + 1] = vel[i * 3 + 1] * f - 9 * dt; vel[i * 3 + 2] *= f;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      if (life[i] < .6) { col[i * 3] *= .93; col[i * 3 + 1] *= .9; col[i * 3 + 2] *= .9; }
    }
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true;
    const e = Math.min(1, (now - start) / 3000); // camera dolly-in with slight orbit
    cam.position.set(Math.sin(now / 6000) * 8 * e, 2 * e, 60 - 18 * (1 - Math.pow(1 - e, 3)));
    cam.lookAt(0, 4 * e, -20);
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  gl = { stop() { alive = false; renderer.dispose(); } };
  addEventListener('pointerdown', ev => { if (ev.target.closest('#ui')) return; burst(); });
}

function start() {
  phase = 'ascii'; document.body.classList.remove('dissolve', 'photo'); caption.textContent = 'ASCII patakas…';
  gl && gl.stop(); gl = null;
  initScene();
  if (params.get('phase') === '3d') { step(16, 3000); return toThreeD(); }
  if (reduce) { for (let i = 0; i < 60; i++) step(50, 3000); caption.textContent = 'Reduced motion: still frame'; setTimeout(toThreeD, 2500); return; }
  raf = requestAnimationFrame(asciiLoop);
}
document.getElementById('replay').onclick = () => { cancelAnimationFrame(raf); start(); };
document.getElementById('skip').onclick = toThreeD;
addEventListener('resize', () => { if (phase === 'ascii') size(); });
start();
