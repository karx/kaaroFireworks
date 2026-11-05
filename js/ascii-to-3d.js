// Kaaro Fireworks: ASCII intro -> real-time 3D (three.js, WebGL2).
// Classic mechanics are NOT reimplemented: the classic scripts (config, performance, audio,
// particles, fireworks, sync, show-editor, ui) are loaded unchanged and own all input, UI,
// launch/explosion logic, physics and audio. This module replaces only main.js: it steps
// the classic simulation exactly like main.js's animate() and renders its state in 3D.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const params = new URLSearchParams(location.search);
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOBILE = innerWidth < 768 || matchMedia('(pointer: coarse)').matches;
const Q = {
  maxPoints: MOBILE ? 9000 : 26000,
  reflector: !MOBILE && !params.has('noreflect'),
  burstLights: MOBILE ? 3 : 6,
  diyaLights: MOBILE ? 2 : 5,
  stars: MOBILE ? 900 : 2200,
  dpr: Math.min(devicePixelRatio, MOBILE ? 1.5 : 2),
};

/* ---------------- renderer / post ---------------- */
const glCanvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Q.dpr);
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0;          // ramps up during the dissolve
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.006); scene.fog.color.setRGB(.06, .046, .075);
const FOV = 45, D = 50;
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 2000);
const baseCam = camera.clone();           // fixed camera that defines classic pixel <-> world mapping

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.95, 0.55, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());       // ACES + sRGB
const grain = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAmt: { value: REDUCE ? 0 : 0.035 } },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform float uTime,uAmt;varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){vec4 c=texture2D(tDiffuse,vUv);float n=h(vUv*vec2(1920.,1080.)+uTime)-.5;
      float v=smoothstep(1.15,.35,length(vUv-.5)*1.25);c.rgb=c.rgb*mix(.72,1.,v)+n*uAmt;gl_FragColor=c;}`,
});
composer.addPass(grain);

/* ---------------- mapping (classic pixels -> world) ---------------- */
let W = innerWidth, H = innerHeight, groundY = 0, pxScale = 1;
const ray = new THREE.Ray(), tmpV = new THREE.Vector3(), ndc = new THREE.Vector2();
function setupCameras() {
  W = innerWidth; H = innerHeight;
  for (const c of [camera, baseCam]) { c.aspect = W / H; c.fov = W < H ? 62 : FOV; c.updateProjectionMatrix(); }
  baseCam.position.set(0, 4.5, D);
  baseCam.lookAt(0, 15, 0);
  baseCam.updateMatrixWorld();
  groundY = pxToWorld(W / 2, H, tmpV).y;          // bottom edge of the screen = ground line at z=0
  const a = pxToWorld(0, H / 2, new THREE.Vector3()), b = pxToWorld(W, H / 2, new THREE.Vector3());
  pxScale = (b.x - a.x) / W;
}
function pxToWorld(px, py, out) {
  ndc.set(px / W * 2 - 1, -(py / H) * 2 + 1);
  ray.origin.setFromMatrixPosition(baseCam.matrixWorld);
  ray.direction.set(ndc.x, ndc.y, 0.5).unproject(baseCam).sub(ray.origin).normalize();
  const t = -ray.origin.z / ray.direction.z;      // plane z = 0
  return out.copy(ray.direction).multiplyScalar(t).add(ray.origin);
}

/* ---------------- textures (procedural, no external images) ---------------- */
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const spriteTex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(.18, '#fff'); r.addColorStop(.45, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const smokeTex = canvasTex(128, 128, (g) => { for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, d = Math.random() * 22, x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d, R = 14 + Math.random() * (40 - d); const r = g.createRadialGradient(x, y, 0, x, y, R); r.addColorStop(0, 'rgba(255,255,255,.12)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); } });
function tileMaps() {
  const N = 1024, T = 8; // 8x8 tiles per texture
  const rnd = Array.from({ length: T * T }, () => Math.random());
  const color = canvasTex(N, N, (g) => {
    g.fillStyle = '#1b1412'; g.fillRect(0, 0, N, N); const s = N / T;
    for (let i = 0; i < T; i++) for (let j = 0; j < T; j++) { const v = rnd[i * T + j]; g.fillStyle = `hsl(${12 + v * 14},${30 + v * 20}%,${18 + v * 10}%)`; g.fillRect(i * s + 4, j * s + 4, s - 8, s - 8);
      for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .15})`; g.fillRect(i * s + Math.random() * s, j * s + Math.random() * s, 3, 3); } }
  });
  const rough = canvasTex(N, N, (g) => {
    g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, N, N); const s = N / T;
    for (let i = 0; i < T; i++) for (let j = 0; j < T; j++) { const v = 40 + rnd[i * T + j] * 70; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(i * s + 4, j * s + 4, s - 8, s - 8); }
    for (let k = 0; k < 90; k++) { const x = Math.random() * N, y = Math.random() * N, r = 20 + Math.random() * 90, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(10,10,10,.8)'); gr.addColorStop(1, 'rgba(10,10,10,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); } // puddles
  }, false);
  const normal = canvasTex(N, N, (g) => {
    g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, N, N); const s = N / T;
    for (let i = 0; i <= T; i++) { g.fillStyle = 'rgb(60,128,200)'; g.fillRect(i * s - 4, 0, 4, N); g.fillStyle = 'rgb(196,128,200)'; g.fillRect(i * s, 0, 4, N); g.fillStyle = 'rgb(128,60,200)'; g.fillRect(0, i * s, N, 4); g.fillStyle = 'rgb(128,196,200)'; g.fillRect(0, i * s - 4, N, 4); }
  }, false);
  for (const t of [color, rough, normal]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(90, 90); }
  return { color, rough, normal };
}

/* ---------------- environment ---------------- */
const pmrem = new THREE.PMREMGenerator(renderer);
new RGBELoader().load('assets/hdri/dikhololo_night_1k.hdr', (hdr) => {
  scene.environment = pmrem.fromEquirectangular(hdr).texture; hdr.dispose();
}, undefined, () => {});

// Sky dome: night gradient + warm city/haze glow at the horizon.
const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uHaze: { value: 1 } },
  vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `varying vec3 vP;uniform float uHaze;void main(){float y=vP.y;
    vec3 top=vec3(.004,.006,.02),mid=vec3(.012,.018,.05),hz=vec3(.05,.03,.028);
    vec3 c=mix(mid,top,smoothstep(0.,.6,y));c+=hz*uHaze*exp(-abs(y)*9.);gl_FragColor=vec4(c,1.);}`,
}));
scene.add(sky);

// Stars (twinkling, like the classic starry background).
const starGeo = new THREE.BufferGeometry();
{ const p = new Float32Array(Q.stars * 3), ph = new Float32Array(Q.stars);
  for (let i = 0; i < Q.stars; i++) { const u = Math.random() * .92 + .06, th = Math.random() * Math.PI * 2, r = 800, s = Math.sqrt(1 - u * u);
    p.set([Math.cos(th) * s * r, u * r, Math.sin(th) * s * r], i * 3); ph[i] = Math.random() * 100; }
  starGeo.setAttribute('position', new THREE.BufferAttribute(p, 3)); starGeo.setAttribute('phase', new THREE.BufferAttribute(ph, 1)); }
const starMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uMap: { value: spriteTex } },
  vertexShader: 'attribute float phase;uniform float uTime;varying float vA;void main(){vA=.45+.55*sin(uTime*(.6+fract(phase)*1.4)+phase);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=(1.2+fract(phase*7.)*2.2);gl_Position=projectionMatrix*mv;}',
  fragmentShader: 'uniform sampler2D uMap;uniform float uOpacity;varying float vA;void main(){gl_FragColor=vec4(vec3(1.2,1.15,1.05)*texture2D(uMap,gl_PointCoord).a*vA*uOpacity,1.);}' });
const starsPts = new THREE.Points(starGeo, starMat); scene.add(starsPts);

// Moon with halo.
const moon = new THREE.Group();
moon.add(new THREE.Mesh(new THREE.SphereGeometry(14, 48, 24), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff1d6, emissiveIntensity: 1.1, roughness: 1, fog: false })));
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex, color: 0x9fb4ff, transparent: true, opacity: .1, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
halo.scale.setScalar(120); moon.add(halo);
moon.position.set(-260, 330, -620); scene.add(moon);
const moonLight = new THREE.DirectionalLight(0x9fb0ff, 0.35); moonLight.position.copy(moon.position); scene.add(moonLight);
scene.add(new THREE.HemisphereLight(0x1a2240, 0x120806, 0.25));

// City skyline (classic "city" background) as instanced emissive-window towers.
const city = new THREE.Group(); scene.add(city);
{ const winTex = canvasTex(64, 128, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, 64, 128); for (let y = 4; y < 128; y += 10) for (let x = 4; x < 64; x += 10) if (Math.random() > .35) { g.fillStyle = Math.random() > .9 ? '#ffff99' : '#ffcc66'; g.fillRect(x, y, 5, 6); } });
  winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping;
  for (let i = 0; i < 46; i++) { const w = 8 + Math.random() * 14, h = 20 + Math.random() * 60, d = 8 + Math.random() * 10;
    const t = winTex.clone(); t.needsUpdate = true; t.repeat.set(w / 10, h / 14);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0x07080c, roughness: .9, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.6 }));
    m.position.set(-260 + i * 11.5 + Math.random() * 4, h / 2, -150 - Math.random() * 70); city.add(m); } }

/* ---------------- ground: wet courtyard tiles + planar reflection ---------------- */
const ground = new THREE.Group(); scene.add(ground);
let reflector = null;
const tm = tileMaps();
const tileMat = new THREE.MeshStandardMaterial({ map: tm.color, roughnessMap: tm.rough, normalMap: tm.normal, normalScale: new THREE.Vector2(.6, .6), roughness: 1, metalness: 0, envMapIntensity: .6, transparent: Q.reflector, opacity: Q.reflector ? .8 : 1 });
const tiles = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), tileMat); tiles.rotation.x = -Math.PI / 2; ground.add(tiles);
function addReflector() {
  reflector = new Reflector(new THREE.PlaneGeometry(4000, 4000), { textureWidth: innerWidth * .5, textureHeight: innerHeight * .5, color: 0x6a6a72, clipBias: .003 });
  reflector.rotation.x = -Math.PI / 2; reflector.position.y = -0.02; ground.add(reflector);
}
if (Q.reflector) addReflector();

/* ---------------- props: diyas, anar, chakri, rocket bottles ---------------- */
const props = new THREE.Group(); scene.add(props);
const clay = new THREE.MeshStandardMaterial({ color: 0x8a3a1a, roughness: .78, metalness: 0 });
const oil = new THREE.MeshPhysicalMaterial({ color: 0x3a2405, roughness: .1, clearcoat: 1 });
const diyaGeo = new THREE.LatheGeometry([[0, 0], [.55, .02], [.9, .2], [1.15, .55], [1.2, .62], [1.05, .6], [.85, .32], [0, .28]].map(([x, y]) => new THREE.Vector2(x, y)), 40);
const flames = [], diyaLights = [];
const flameTex = canvasTex(64, 128, (g) => { const r = g.createRadialGradient(32, 88, 2, 32, 80, 34); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,220,150,.85)'); r.addColorStop(.7, 'rgba(255,140,40,.25)'); r.addColorStop(1, 'rgba(255,100,20,0)'); g.fillStyle = r; g.beginPath(); g.moveTo(32, 4); g.bezierCurveTo(52, 50, 64, 80, 32, 124); g.bezierCurveTo(0, 80, 12, 50, 32, 4); g.fill(); });
function flameSprite() { return new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, color: new THREE.Color(4, 1.8, .5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); }
function makeDiya(x, z, s = 1) {
  const g = new THREE.Group(); const b = new THREE.Mesh(diyaGeo, clay); g.add(b);
  const o = new THREE.Mesh(new THREE.CircleGeometry(.95, 24), oil); o.rotation.x = -Math.PI / 2; o.position.y = .5; g.add(o);
  const f = flameSprite(); f.position.set(.8, 1.05, 0); f.scale.set(.5, .95, 1); g.add(f); flames.push(f);
  const core = flameSprite(); core.material.color.setRGB(8, 6, 3); core.position.copy(f.position); core.scale.set(.18, .4, 1); g.add(core); flames.push(core);
  g.position.set(x, 0, z); g.scale.setScalar(s); g.rotation.y = Math.random() * 6; props.add(g); return g;
}
const anarMat = new THREE.MeshStandardMaterial({ color: 0xc89a3a, metalness: .55, roughness: .35,
  map: canvasTex(256, 256, (g) => { g.fillStyle = '#d4a240'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 32) { g.fillStyle = '#b11d2c'; g.fillRect(0, y, 256, 10); g.fillStyle = '#1f6b3a'; g.fillRect(0, y + 14, 256, 4); } }) });
const anar = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.4, 40, 1, true), anarMat); props.add(anar);
const anarCap = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), clay); anarCap.rotation.x = Math.PI / 2; anarCap.position.y = -1.7; anar.add(anarCap);
const chakri = new THREE.Group(); props.add(chakri);
{ const pts = []; for (let i = 0; i < 160; i++) { const a = i / 160 * Math.PI * 8, r = .2 + i / 160 * 1.4; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  chakri.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 320, .11, 8), new THREE.MeshStandardMaterial({ color: 0x2b7a3c, roughness: .5, metalness: .2, emissive: 0xff5a10, emissiveIntensity: .3 }))); }
const rocketBodyGeo = new THREE.CylinderGeometry(.16, .16, 1.3, 16), rocketTipGeo = new THREE.ConeGeometry(.2, .45, 16), stickGeo = new THREE.CylinderGeometry(.025, .025, 2.6, 6);
const rocketMat = new THREE.MeshStandardMaterial({ color: 0xb3122a, roughness: .45, metalness: .1 }), tipMat = new THREE.MeshStandardMaterial({ color: 0xe8c36a, metalness: .7, roughness: .3 }), stickMat = new THREE.MeshStandardMaterial({ color: 0x9b7a4a, roughness: .9 });
function rocketMesh() {
  const g = new THREE.Group(); g.add(new THREE.Mesh(rocketBodyGeo, rocketMat)); const t = new THREE.Mesh(rocketTipGeo, tipMat); t.position.y = .87; g.add(t);
  const s = new THREE.Mesh(stickGeo, stickMat); s.position.set(.2, -1.3, 0); g.add(s);
  const f = flameSprite(); f.position.y = -.8; f.scale.set(.9, 1.6, 1); g.add(f); return g;
}
const bottle = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, 2.2, 24), new THREE.MeshPhysicalMaterial({ color: 0x2a6b3f, roughness: .08, transmission: .6, thickness: .4, ior: 1.5 }));
props.add(bottle);
const decoRocket = rocketMesh(); props.add(decoRocket);
const anarLight = new THREE.PointLight(0xffb050, 0, 40, 2); props.add(anarLight);
const chakriLight = new THREE.PointLight(0xff8030, 0, 30, 2); props.add(chakriLight);
const diyaGroups = [];
function layoutProps() {
  const span = Math.min(60, (pxToWorld(W, H, tmpV).x) * 2 * .92);
  props.position.y = groundY; ground.position.y = groundY;
  diyaGroups.forEach(g => props.remove(g)); diyaGroups.length = 0; flames.length = 0;
  diyaLights.forEach(l => props.remove(l)); diyaLights.length = 0;
  const n = MOBILE ? 7 : 13;
  for (let i = 0; i < n; i++) { const x = -span / 2 + (i + .5) * span / n; diyaGroups.push(makeDiya(x, 4 + Math.sin(i * 1.7) * 1.5, 1.5)); }
  for (let i = 0; i < 9; i++) diyaGroups.push(makeDiya((Math.random() - .5) * span * 1.4, -12 - Math.random() * 30, 1.2));
  for (let i = 0; i < Q.diyaLights; i++) { const g = diyaGroups[Math.round(i * (n - 1) / Math.max(1, Q.diyaLights - 1))]; const l = new THREE.PointLight(0xff9a3c, 6, 14, 2); l.position.set(g.position.x, 1.3, g.position.z); props.add(l); diyaLights.push(l); }
  anar.position.set(-span * .3, 1.7, -2); anarLight.position.set(-span * .3, 4, -2);
  chakri.position.set(span * .27, .15, 1); chakriLight.position.set(span * .27, 1.5, 1);
  bottle.position.set(span * .12, 1.1, -4); decoRocket.position.set(span * .12, 2.6, -4); decoRocket.rotation.z = -.12;
}

/* ---------------- unified HDR particle renderer ---------------- */
const P = Q.maxPoints;
const pPos = new Float32Array(P * 3), pCol = new Float32Array(P * 3), pSize = new Float32Array(P);
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('size', new THREE.BufferAttribute(pSize, 1).setUsage(THREE.DynamicDrawUsage));
const pMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uMap: { value: spriteTex }, uScale: { value: 1 } },
  vertexShader: 'attribute float size;attribute vec3 color;varying vec3 vC;uniform float uScale;void main(){vC=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=max(1.5,size*uScale/-mv.z);gl_Position=projectionMatrix*mv;}',
  fragmentShader: 'varying vec3 vC;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float a=pow(1.-d,2.2)+.6*pow(max(0.,1.-d*2.6),2.);gl_FragColor=vec4(vC*a,1.);}' });
const pts = new THREE.Points(pGeo, pMat); pts.frustumCulled = false; scene.add(pts);
let pN = 0;
function emit(x, y, z, r, g, b, size) { if (pN >= P) return; const i = pN++; pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; pCol[i * 3] = r; pCol[i * 3 + 1] = g; pCol[i * 3 + 2] = b; pSize[i] = size; }
const colorCache = new Map();
function col(str) { let c = colorCache.get(str); if (!c) { c = new THREE.Color(str); colorCache.set(str, c); if (colorCache.size > 4000) colorCache.clear(); } return c; }

// Decorative sparks (anar fountain, chakri, rocket exhaust, ASCII dissolve). World units, seconds.
const sparks = []; const MAXS = MOBILE ? 1500 : 4000;
function spark(x, y, z, vx, vy, vz, life, c, size = .5, drag = 1.2, grav = 9) { if (sparks.length < MAXS) sparks.push({ x, y, z, vx, vy, vz, life, max: life, c, size, drag, grav }); }

// Smoke puffs and burst lights.
const smokes = [];
const smokeMat = new THREE.SpriteMaterial({ map: smokeTex, color: 0x8a8a96, transparent: true, depthWrite: false, opacity: 0, fog: true });
function smoke(x, y, z, tint) { if (smokes.length > (MOBILE ? 18 : 48)) { const s = smokes.shift(); scene.remove(s.s); }
  const s = new THREE.Sprite(smokeMat.clone()); s.material.color.copy(tint).lerp(new THREE.Color(0x2a2a30), .93); s.position.set(x, y, z); s.material.rotation = Math.random() * 6; s.scale.setScalar(4); scene.add(s);
  smokes.push({ s, t: 0, life: 7 + Math.random() * 3, vx: .6 + Math.random() * .6, vy: .4 + Math.random() * .4, g: 4 + Math.random() * 6 }); }
const bLights = Array.from({ length: Q.burstLights }, () => { const l = new THREE.PointLight(0xffffff, 0, 120, 1.6); scene.add(l); return { l, t: 9, max: 1 }; });
let bIdx = 0;
function burstLight(x, y, z, c) { const b = bLights[bIdx++ % bLights.length]; b.l.position.set(x, y, z); b.l.color.copy(c); b.t = 0; b.max = .9; }

/* ---------------- hook the classic explosion to add 3D-only effects (light/smoke) ---------------- */
const classicCreateExplosion = window.createExplosion;
window.createExplosion = function (x, y, style) {
  const before = window.particles.length;
  classicCreateExplosion.call(this, x, y, style);
  const p = window.particles[before]; const c = p ? col(p.startColor) : new THREE.Color(1, 1, 1);
  const w = pxToWorld(x, y, new THREE.Vector3());
  burstLight(w.x, w.y, w.z, c); smoke(w.x, w.y, w.z - 1, c); smoke(w.x + 2, w.y - 1, w.z - 2, c);
};
// Give every classic particle a depth component without touching its 2D physics.
const PI = window.Particle.prototype.init;
window.Particle.prototype.init = function (...a) { PI.apply(this, a); const sp = Math.hypot(this.vx, this.vy); this._z = 0; this._vz = (Math.random() * 2 - 1) * sp * .55; };

/* ---------------- classic main.js responsibilities ---------------- */
function resizeCanvas() {            // identical to main.js resizeCanvas()
  window.canvas.width = innerWidth; window.canvas.height = innerHeight; window.config.isMobile = innerWidth < 768;
  if (window.config.background === 'starry') window.initStars(); else if (window.config.background === 'city') window.initCity();
  renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight);
  setupCameras(); layoutProps();
  pMat.uniforms.uScale.value = innerHeight * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
}
const rocketMeshes = new Map();
function stepClassic() {           // the body of main.js animate(), minus 2D drawing
  const fw = window.fireworks;
  for (let i = fw.length - 1; i >= 0; i--) {
    const f = fw[i]; const exploded = f.update();
    if (exploded) { fw.splice(i, 1); window.createExplosion(f.x, f.y, window.selectedFireworkStyle || 'random'); }
  }
  const ps = window.particles;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i]; const dead = p.update();
    if (p._vz !== undefined) { p._vz *= window.config.friction; p._z += p._vz; }
    if (dead) { ps.splice(i, 1); window.particlePool.release(p); }
  }
}

/* ---------------- render classic state in 3D ---------------- */
const wp = new THREE.Vector3(), wq = new THREE.Vector3();
function drawClassic(dt) {
  const s = pxScale;
  // rockets: 3D model + exhaust sparks + the classic 10-point trail
  const live = new Set();
  for (const f of window.fireworks) {
    live.add(f); let m = rocketMeshes.get(f);
    if (!m) { m = rocketMesh(); scene.add(m); rocketMeshes.set(f, m); }
    pxToWorld(f.x, f.y, wp); m.position.copy(wp);
    m.rotation.z = Math.atan2(-f.vx, -f.vy) * -1; m.rotation.z = -Math.atan2(f.vx, -f.vy);
    const ex = m.position.x + Math.sin(m.rotation.z) * .9, ey = m.position.y - Math.cos(m.rotation.z) * .9;
    for (let k = 0; k < (REDUCE ? 1 : 3); k++) spark(ex, ey, wp.z, (Math.random() - .5) * 3, -2 - Math.random() * 3, (Math.random() - .5) * 3, .5 + Math.random() * .4, col('#ffb35a'), .35);
    f.trail.forEach((t, i) => { pxToWorld(t.x, t.y, wq); const a = (i / f.trail.length) * 2.2; emit(wq.x, wq.y, wq.z, a, a * .85, a * .6, .5); });
    emit(wp.x, wp.y, wp.z, 6, 5, 4, 1.1);
  }
  for (const [f, m] of rocketMeshes) if (!live.has(f)) { scene.remove(m); rocketMeshes.delete(f); spark(m.position.x, m.position.y, m.position.z, 0, 0, 0, .15, col('#fff4e0'), 3.5, 0, 0); }
  // explosion particles: same alpha, size, twinkle, trail and color transition as Particle.draw()
  for (const p of window.particles) {
    let a = p.alpha; if (p.twinkle) a *= .5 + Math.sin(p.twinklePhase) * .5; if (a <= 0) continue;
    const c = col(p.color); pxToWorld(p.x, p.y, wp); const z = (p._z || 0) * s; const k = a * 6;
    const size = p.size * s * 2 * (p.alpha > .7 ? 3.4 : 2.4);
    emit(wp.x, wp.y, wp.z + z, c.r * k + a * .6, c.g * k + a * .6, c.b * k + a * .6, size);
    if (p.hasTrail && p.trail.length > 1) for (let i = 0; i < p.trail.length - 1; i++) {
      const t = p.trail[i], ta = (i / p.trail.length) * t.alpha * .5 * 3; pxToWorld(t.x, t.y, wq);
      emit(wq.x, wq.y, wq.z + z * (.85 + .15 * i / p.trail.length), c.r * ta * 1.8, c.g * ta * 1.8, c.b * ta * 1.8, p.size * s * 2);
    }
  }
}

/* ---------------- ambient fireworks on the ground (décor only) ---------------- */
let chakriAngle = 0;
function ambient(dt, t) {
  const ap = anar.getWorldPosition(wp); const tip = ap.y + 1.7;
  const fl = .8 + Math.sin(t * 31) * .1 + Math.random() * .2; anarLight.intensity = (REDUCE ? 60 : 140) * fl;
  for (let k = 0; k < (REDUCE ? 2 : MOBILE ? 6 : 14); k++) { const sp = 9 + Math.random() * 9, th = Math.random() * Math.PI * 2, r = Math.random() * .28;
    spark(ap.x, tip, ap.z, Math.cos(th) * r * sp, sp, Math.sin(th) * r * sp, .7 + Math.random() * .9, col(Math.random() > .3 ? '#ffc46a' : '#fff2c8'), .38, .9, 11); }
  chakriAngle += dt * (REDUCE ? 2 : 14); chakri.rotation.y = chakriAngle;
  const cp = chakri.getWorldPosition(wq); chakriLight.intensity = 70 * (.7 + Math.random() * .3);
  for (let k = 0; k < (REDUCE ? 1 : MOBILE ? 3 : 6); k++) { const a = chakriAngle + k * 2.1, R = 1.5;
    spark(cp.x + Math.cos(a) * R, cp.y + .1, cp.z + Math.sin(a) * R, -Math.sin(a) * 9 + (Math.random() - .5) * 2, 1 + Math.random() * 2, Math.cos(a) * 9 + (Math.random() - .5) * 2, .4 + Math.random() * .3, col(k % 2 ? '#ffd27a' : '#ff7a3a'), .32, 1.5, 9); }
  flames.forEach((f, i) => { const j = .85 + Math.sin(t * 13 + i * 1.7) * .08 + Math.random() * .07; f.scale.y = (i % 2 ? .4 : .95) * j; });
  diyaLights.forEach((l, i) => l.intensity = 6 * (.85 + Math.sin(t * 11 + i) * .1 + Math.random() * .08));
}
function stepSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= dt; if (s.life <= 0) { sparks.splice(i, 1); continue; }
    if (s.target) { const e = 1 - Math.pow(1 - Math.min(1, (s.max - s.life) / (s.max * .8)), 3); s.x = s.ox + (s.target.x - s.ox) * e; s.y = s.oy + (s.target.y - s.oy) * e + Math.sin(e * Math.PI) * s.arc; s.z = s.oz + (s.target.z - s.oz) * e; }
    else { const d = Math.exp(-s.drag * dt); s.vx *= d; s.vy = s.vy * d - s.grav * dt; s.vz *= d; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
      if (s.y < groundY + .05 && s.vy < 0) { s.y = groundY + .05; s.vy *= -.3; s.vx *= .6; s.vz *= .6; } }
    const a = Math.min(1, s.life / s.max * 1.6) * 3; emit(s.x, s.y, s.z, s.c.r * a, s.c.g * a, s.c.b * a, s.size); }
}
function stepFx(dt) {
  for (const b of bLights) { b.t += dt; const e = Math.max(0, 1 - b.t / b.max); b.l.intensity = 9000 * e * e; }
  for (let i = smokes.length - 1; i >= 0; i--) { const s = smokes[i]; s.t += dt; const k = s.t / s.life;
    if (k >= 1) { scene.remove(s.s); s.s.material.dispose(); smokes.splice(i, 1); continue; }
    s.s.position.x += s.vx * dt; s.s.position.y += s.vy * dt; s.s.scale.setScalar(4 + s.g * Math.sqrt(k) * 2.2); s.s.material.opacity = Math.sin(Math.min(1, k * 4) * Math.PI / 2) * (1 - k) * .3; }
}

/* ---------------- ASCII intro (unchanged look from the first variation) ---------------- */
const pre = document.getElementById('ascii'), caption = document.getElementById('caption');
let COLS, ROWS, grid, ents, introT0, introRaf, phase = 'ascii';
const DIYA = ['  (  ', ' _)_ ', '\\___/'];
function asciiSize() { const fs = parseFloat(getComputedStyle(pre).fontSize); COLS = Math.min(140, Math.max(40, Math.floor(innerWidth / (fs * .62)))); ROWS = Math.min(60, Math.max(24, Math.floor(innerHeight * .82 / (fs * 1.05)))); }
const put = (x, y, c) => { x |= 0; y |= 0; if (y >= 0 && y < ROWS && x >= 0 && x < COLS) grid[y][x] = c; };
function initAscii() { asciiSize(); ents = []; introT0 = performance.now(); const n = Math.max(3, Math.floor(COLS / 14));
  for (let i = 0; i < n; i++) ents.push({ k: 'diya', x: Math.round((i + .5) * COLS / n) - 2 });
  ents.push({ k: 'anar', x: Math.round(COLS * .22), sp: [] }, { k: 'chakri', x: Math.round(COLS * .75), y: ROWS - 6, a: 0 }); }
function asciiStep(dt, t) {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(' '));
  for (let i = 0; i < COLS * .4; i++) { const s = (i * 9301 + 49297) % 233280; if (((t / 400 + i) | 0) % 7) put(s % COLS, (s >> 3) % (ROWS / 2), '.'); }
  if (Math.random() < dt * .0012) ents.push({ k: 'rocket', x: 6 + Math.random() * (COLS - 12), y: ROWS - 4, vy: -(18 + Math.random() * 10), top: 3 + Math.random() * ROWS * .35 });
  const gY = ROWS - 3;
  for (const e of ents) {
    if (e.k === 'diya') DIYA.forEach((row, r) => [...row].forEach((c, j) => c !== ' ' && put(e.x + j, gY + r, r === 0 ? '()'[Math.random() * 2 | 0] : c)));
    if (e.k === 'anar') { [[-1, 1, '/'], [0, 1, '#'], [1, 1, '\\'], [-2, 2, '/'], [2, 2, '\\'], [-1, 2, '#'], [0, 2, '#'], [1, 2, '#']].forEach(([dx, dy, c]) => put(e.x + dx, gY + dy, c));
      for (let i = 0; i < 4; i++) e.sp.push({ x: e.x, y: gY, vx: (Math.random() - .5) * 10, vy: -(14 + Math.random() * 14), l: 1.6 });
      e.sp = e.sp.filter(s => (s.l -= dt / 1000) > 0); for (const s of e.sp) { s.vy += 22 * dt / 1000; s.x += s.vx * dt / 1000; s.y += s.vy * dt / 1000; put(s.x, s.y, s.l > 1.1 ? '*' : s.l > .5 ? '+' : '.'); } }
    if (e.k === 'chakri') { e.a += dt / 90; put(e.x, e.y, '@'); for (let r = 1; r <= 3; r++) for (let j = 0; j < 4; j++) { const a = e.a + j * Math.PI / 2 + r * .5; put(e.x + Math.cos(a) * r * 2, e.y + Math.sin(a) * r, r === 3 ? '*' : '~'); } }
    if (e.k === 'rocket') { e.y += e.vy * dt / 1000; put(e.x, e.y, '^'); put(e.x, e.y + 1, '|'); put(e.x, e.y + 2, ':'); put(e.x, e.y + 3, '.'); if (e.y <= e.top) { e.dead = true; ents.push({ k: 'burst', x: e.x, y: e.y, r: 0, ch: '*o+x#@'[Math.random() * 6 | 0] }); } }
    if (e.k === 'burst') { e.r += dt / 70; const R = e.r; for (let j = 0; j < 22; j++) { const a = j / 22 * Math.PI * 2; put(e.x + Math.cos(a) * R * 2, e.y + Math.sin(a) * R + R * R * .02, R > 9 ? '.' : R > 6 ? '+' : e.ch); } if (R > 12) e.dead = true; }
  }
  ents = ents.filter(e => !e.dead);
  const msg = 'S H U B H   D E E P A V A L I';
  if (t > 1200) [...msg].forEach((c, i) => i < (t - 1200) / 60 && put((COLS - msg.length) / 2 + i, Math.floor(ROWS * .55), c));
  pre.textContent = grid.map(r => r.join('')).join('\n');
}
function asciiLoop(now) { const t = now - introT0, dt = Math.min(50, now - (asciiLoop.l || now)); asciiLoop.l = now; asciiStep(dt, t);
  if (t > 6500 && !params.has('hold')) return dissolve(); introRaf = requestAnimationFrame(asciiLoop); }

// Dissolve: every lit glyph becomes an HDR spark that flies into the 3D scene and settles on a real
// object: '()' flames onto diya wicks, anar/chakri glyphs onto the anar and chakri, banner letters
// and star dots up into the sky, burst glyphs scatter as embers onto the wet tiles.
let introStart = 0;
function dissolve() {
  if (phase !== 'ascii') return; phase = 'dissolve'; cancelAnimationFrame(introRaf);
  const range = document.createRange(); range.selectNodeContents(pre); const tb = range.getBoundingClientRect();
  const lines = pre.textContent.split('\n'), cw = tb.width / COLS, chh = tb.height / lines.length;
  const wicks = flames.filter((_, i) => i % 2 === 0).map(f => f.getWorldPosition(new THREE.Vector3()));
  const anarTip = anar.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.7, 0)), ch = chakri.getWorldPosition(new THREE.Vector3());
  const gold = col('#ffcf6b');
  lines.forEach((l, y) => [...l].forEach((c, x) => { if (c === ' ') return;
    const o = pxToWorld(tb.left + (x + .5) * cw, tb.top + (y + .5) * chh, new THREE.Vector3()); let tgt, colr = gold, arc = 2;
    if ('()'.includes(c)) { tgt = wicks[Math.random() * wicks.length | 0]; colr = col('#ffb04a'); }
    else if ('/\\#'.includes(c) && x < COLS * .4) tgt = anarTip;
    else if ('@~'.includes(c)) tgt = ch.clone().add(new THREE.Vector3((Math.random() - .5) * 3, .2, (Math.random() - .5) * 3));
    else if (c === '.' && y < ROWS * .5 || /[A-Z]/.test(c)) { tgt = new THREE.Vector3(o.x * 2.5 + (Math.random() - .5) * 30, o.y + 25 + Math.random() * 40, -120 - Math.random() * 80); arc = 6; colr = /[A-Z]/.test(c) ? col('#fff3c4') : col('#cfe0ff'); }
    else tgt = new THREE.Vector3(o.x + (Math.random() - .5) * 20, groundY + .1, (Math.random() - .5) * 30);
    for (let k = 0; k < 2; k++) { const life = (REDUCE ? .9 : 2.4) + Math.random() * .6;
      sparks.push({ x: o.x, y: o.y, z: o.z, ox: o.x, oy: o.y, oz: o.z, target: tgt, arc: arc * (Math.random() - .3), life, max: life, c: colr, size: .55 }); }
  }));
  document.body.classList.add('dissolve'); caption.textContent = '';
  introStart = performance.now();
  setTimeout(enterShow, REDUCE ? 600 : 2600);
}
function enterShow() {
  if (phase === 'show') return; phase = 'show';
  document.body.classList.remove('intro'); pre.remove();
  // main.js init(): initial firework after 500ms
  setTimeout(() => window.launchFirework(window.canvas.width / 2, window.canvas.height / 3), 500);
}

/* ---------------- capture/share: copy the 3D frame into the classic canvas first ---------------- */
function mirrorTo2D() { composer.render(); const c = window.canvas; c.getContext('2d').drawImage(glCanvas, 0, 0, c.width, c.height); setTimeout(() => c.getContext('2d').clearRect(0, 0, c.width, c.height), 500); }
['captureBtn', 'shareBtn'].forEach(id => document.getElementById(id)?.addEventListener('click', mirrorTo2D, true));

/* ---------------- main loop ---------------- */
let last = performance.now(), acc = 0, fpsAvg = 60, perfT = 0, dprNow = Q.dpr;
const STEP = 1000 / 60;
function frame(now) {
  requestAnimationFrame(frame);
  const dtMs = Math.min(100, now - last); last = now; const dt = dtMs / 1000;
  if (phase === 'show') {
    window.updateFPS();
    if (window.performanceConfig.batterySaving && window.performanceConfig.frameCount % 2 === 0) return; // same as classic
    acc += dtMs; let n = 0; while (acc >= STEP && n < 6) { stepClassic(); acc -= STEP; n++; } if (n >= 6) acc = 0;
    window.updateProfiler();
  }
  // scene intro: exposure ramp + camera dolly from the ASCII plane into the courtyard
  const e = phase === 'ascii' ? 0 : Math.min(1, (now - introStart) / (REDUCE ? 600 : 3200));
  renderer.toneMappingExposure = 1.05 * e * (2 - e);
  starMat.uniforms.uOpacity.value = e * (window.config.background === 'black' ? 0 : 1);
  starMat.uniforms.uTime.value = now / 1000; grain.uniforms.uTime.value = now / 7;
  const bg = window.config.background; city.visible = bg === 'city'; moon.visible = bg !== 'black'; moonLight.intensity = bg === 'black' ? .08 : .35; sky.material.uniforms.uHaze.value = bg === 'black' ? .15 : bg === 'city' ? 1.6 : 1;
  const ease = 1 - Math.pow(1 - e, 3), sway = REDUCE ? 0 : 1;
  camera.position.set(baseCam.position.x + Math.sin(now / 9000) * 1.4 * sway, baseCam.position.y + (1 - ease) * 8 + Math.sin(now / 7000) * .4 * sway, baseCam.position.z - (1 - ease) * 30);
  camera.lookAt(Math.sin(now / 9000) * .7 * sway, 16 - (1 - ease) * 2, 0);
  pN = 0;
  if (phase !== 'ascii') { ambient(dt, now / 1000); drawClassic(dt); }
  stepSparks(dt); stepFx(dt);
  pGeo.setDrawRange(0, pN); for (const k of ['position', 'color', 'size']) { const a = pGeo.attributes[k]; a.clearUpdateRanges?.(); a.needsUpdate = true; }
  composer.render(dt);
  // adaptive resolution: hold ~60fps, degrade gracefully
  fpsAvg += ((1000 / Math.max(1, dtMs)) - fpsAvg) * .05; perfT += dtMs;
  if (perfT > 1500 && phase === 'show') { perfT = 0;
    if (fpsAvg < 48 && dprNow > .6) { dprNow = Math.max(.6, dprNow - .2); renderer.setPixelRatio(dprNow); composer.setPixelRatio(dprNow); }
    else if (fpsAvg < 40 && reflector) { ground.remove(reflector); reflector = null; tileMat.transparent = false; tileMat.opacity = 1; tileMat.needsUpdate = true; }
    else if (fpsAvg > 58 && dprNow < Q.dpr) { dprNow = Math.min(Q.dpr, dprNow + .1); renderer.setPixelRatio(dprNow); composer.setPixelRatio(dprNow); }
    pMat.uniforms.uScale.value = innerHeight * dprNow / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  }
}

/* ---------------- boot: classic init() sequence (minus the 2D animate loop) ---------------- */
resizeCanvas(); addEventListener('resize', resizeCanvas);
window.initUI(); window.initUserInteraction(); window.loadURLConfig();
window.initSyncControls?.(); window.initShowEditor?.();
let first = false; const track = () => { if (!first) { first = true; window.analytics?.trackFirstInteraction(); } };
window.canvas.addEventListener('click', track, { once: true }); window.canvas.addEventListener('touchstart', track, { once: true });
document.getElementById('skipIntro').onclick = dissolve;
initAscii();
if (params.get('phase') === '3d') { asciiStep(16, 3000); dissolve(); }
else if (REDUCE) { for (let i = 0; i < 60; i++) asciiStep(50, 3000); caption.textContent = 'Reduced motion: still frame'; setTimeout(dissolve, 1500); }
else introRaf = requestAnimationFrame(asciiLoop);
requestAnimationFrame(frame);
window.__kf3d = { scene, renderer, pxToWorld, get fps() { return fpsAvg; }, get points() { return pN; } };
