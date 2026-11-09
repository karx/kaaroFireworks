// Kaaro Fireworks: ASCII intro -> real-time 3D (three.js, WebGL2).
// Classic mechanics are NOT reimplemented: classic scripts own input, UI, launch,
// explosion logic, physics and audio. This module replaces only main.js: it steps
// the classic simulation and renders state with game-engine VFX (HDR ACES, multi-pass
// bloom, temperature lifetime, velocity streaks, crackle, volumetric smoke, shake).
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
  maxPoints: MOBILE ? 9000 : 28000,
  reflector: !MOBILE && !params.has('noreflect'),
  burstLights: MOBILE ? 3 : 8,
  diyaLights: MOBILE ? 2 : 5,
  stars: MOBILE ? 900 : 2200,
  dpr: Math.min(devicePixelRatio, MOBILE ? 1.5 : 2),
  bloomStrength: MOBILE ? 0.45 : 0.55,
  bloomRadius: MOBILE ? 0.28 : 0.4,
  bloomThreshold: 0.68,
  streaks: !REDUCE,
  crackle: !REDUCE,
  ca: REDUCE ? 0 : (MOBILE ? 0.0007 : 0.0011),
};

/* ---------------- renderer / post ---------------- */
const glCanvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Q.dpr);
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0038); scene.fog.color.setRGB(.02, .015, .03);
const FOV = 45, D = 50;
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 2000);
const baseCam = camera.clone();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// Unreal-style multi-mip bloom: low threshold so HDR cores bloom hard, radius for soft halo.
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), Q.bloomStrength, Q.bloomRadius, Q.bloomThreshold);
composer.addPass(bloom);
// Soft secondary bloom plate (game "light shaft" feel) — cheap full-screen blur of bright areas.
const softBloom = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uAmt: { value: MOBILE ? 0.0 : 0.02 },
    uRes: { value: new THREE.Vector2(innerWidth, innerHeight) },
  },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform float uAmt;uniform vec2 uRes;varying vec2 vUv;
    void main(){
      vec4 c=texture2D(tDiffuse,vUv);
      vec2 px=1.0/uRes;
      vec3 blur=vec3(0.);
      // 9-tap diamond blur biased toward bright pixels
      blur+=texture2D(tDiffuse,vUv).rgb;
      blur+=texture2D(tDiffuse,vUv+vec2( px.x*2.,0.)).rgb;
      blur+=texture2D(tDiffuse,vUv+vec2(-px.x*2.,0.)).rgb;
      blur+=texture2D(tDiffuse,vUv+vec2(0., px.y*2.)).rgb;
      blur+=texture2D(tDiffuse,vUv+vec2(0.,-px.y*2.)).rgb;
      blur+=texture2D(tDiffuse,vUv+vec2( px.x*3., px.y*3.)).rgb;
      blur+=texture2D(tDiffuse,vUv+vec2(-px.x*3., px.y*3.)).rgb;
      blur+=texture2D(tDiffuse,vUv+vec2( px.x*3.,-px.y*3.)).rgb;
      blur+=texture2D(tDiffuse,vUv+vec2(-px.x*3.,-px.y*3.)).rgb;
      blur*=0.1111;
      float lum=dot(blur,vec3(0.2126,0.7152,0.0722));
      vec3 glow=blur*smoothstep(0.85,1.8,lum);
      gl_FragColor=vec4(c.rgb+glow*uAmt,c.a);
    }`,
});
composer.addPass(softBloom);
composer.addPass(new OutputPass());
// Film grain + vignette + subtle chromatic aberration (post ACES).
const grade = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAmt: { value: REDUCE ? 0 : 0.02 },
    uCA: { value: Q.ca },
    uShake: { value: new THREE.Vector2(0, 0) },
  },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform float uTime,uAmt,uCA;uniform vec2 uShake;varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){
      vec2 uv=vUv+uShake;
      vec2 d=uv-0.5;
      float r=length(d);
      vec2 dir=r>1e-4?d/r:vec2(0.);
      float ca=uCA*(0.4+r*1.6);
      float cr=texture2D(tDiffuse,uv+dir*ca).r;
      float cg=texture2D(tDiffuse,uv).g;
      float cb=texture2D(tDiffuse,uv-dir*ca).b;
      vec3 c=vec3(cr,cg,cb);
      float n=h(uv*vec2(1920.,1080.)+uTime)-.5;
      float v=smoothstep(1.2,.32,r*1.35);
      c=c*mix(.68,1.,v)+n*uAmt;
      gl_FragColor=vec4(c,1.);
    }`,
});
composer.addPass(grade);

/* ---------------- mapping (classic pixels -> world) ---------------- */
let W = innerWidth, H = innerHeight, groundY = 0, pxScale = 1;
const ray = new THREE.Ray(), tmpV = new THREE.Vector3(), ndc = new THREE.Vector2();
function setupCameras() {
  W = innerWidth; H = innerHeight;
  for (const c of [camera, baseCam]) { c.aspect = W / H; c.fov = W < H ? 62 : FOV; c.updateProjectionMatrix(); }
  baseCam.position.set(0, 4.5, D);
  baseCam.lookAt(0, 15, 0);
  baseCam.updateMatrixWorld();
  groundY = pxToWorld(W / 2, H, tmpV).y;
  const a = pxToWorld(0, H / 2, new THREE.Vector3()), b = pxToWorld(W, H / 2, new THREE.Vector3());
  pxScale = (b.x - a.x) / W;
}
function pxToWorld(px, py, out) {
  ndc.set(px / W * 2 - 1, -(py / H) * 2 + 1);
  ray.origin.setFromMatrixPosition(baseCam.matrixWorld);
  ray.direction.set(ndc.x, ndc.y, 0.5).unproject(baseCam).sub(ray.origin).normalize();
  const t = -ray.origin.z / ray.direction.z;
  return out.copy(ray.direction).multiplyScalar(t).add(ray.origin);
}

/* ---------------- textures ---------------- */
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const spriteTex = canvasTex(64, 64, (g) => {
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, '#fff'); r.addColorStop(.12, '#fff'); r.addColorStop(.4, 'rgba(255,255,255,.45)');
  r.addColorStop(.7, 'rgba(255,255,255,.12)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
});
// Soft volumetric smoke with multi-lobe noise.
const smokeTex = canvasTex(128, 128, (g) => {
  for (let i = 0; i < 55; i++) {
    const a = Math.random() * 6.28, d = Math.random() * 28, x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d;
    const R = 10 + Math.random() * (42 - d * 0.6);
    const r = g.createRadialGradient(x, y, 0, x, y, R);
    const a0 = 0.06 + Math.random() * 0.1;
    r.addColorStop(0, `rgba(255,255,255,${a0})`); r.addColorStop(0.55, `rgba(255,255,255,${a0 * 0.35})`);
    r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  }
});
// Streak billboard: bright core along the long axis for motion blur ribbons.
const streakTex = canvasTex(128, 32, (g) => {
  const r = g.createRadialGradient(64, 16, 0, 64, 16, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.2, 'rgba(255,255,255,.85)');
  r.addColorStop(0.55, 'rgba(255,255,255,.2)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 32);
  const v = g.createLinearGradient(0, 0, 0, 32);
  v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-in'; g.fillStyle = v; g.fillRect(0, 0, 128, 32);
}, false);

function tileMaps() {
  const N = 1024, T = 8;
  const rnd = Array.from({ length: T * T }, () => Math.random());
  const color = canvasTex(N, N, (g) => {
    g.fillStyle = '#1b1412'; g.fillRect(0, 0, N, N); const s = N / T;
    for (let i = 0; i < T; i++) for (let j = 0; j < T; j++) {
      const v = rnd[i * T + j]; g.fillStyle = `hsl(${12 + v * 14},${30 + v * 20}%,${18 + v * 10}%)`;
      g.fillRect(i * s + 4, j * s + 4, s - 8, s - 8);
      for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .15})`; g.fillRect(i * s + Math.random() * s, j * s + Math.random() * s, 3, 3); }
    }
  });
  const rough = canvasTex(N, N, (g) => {
    g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, N, N); const s = N / T;
    for (let i = 0; i < T; i++) for (let j = 0; j < T; j++) {
      const v = 40 + rnd[i * T + j] * 70; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(i * s + 4, j * s + 4, s - 8, s - 8);
    }
    for (let k = 0; k < 90; k++) {
      const x = Math.random() * N, y = Math.random() * N, r = 20 + Math.random() * 90;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(10,10,10,.8)'); gr.addColorStop(1, 'rgba(10,10,10,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  }, false);
  const normal = canvasTex(N, N, (g) => {
    g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, N, N); const s = N / T;
    for (let i = 0; i <= T; i++) {
      g.fillStyle = 'rgb(60,128,200)'; g.fillRect(i * s - 4, 0, 4, N);
      g.fillStyle = 'rgb(196,128,200)'; g.fillRect(i * s, 0, 4, N);
      g.fillStyle = 'rgb(128,60,200)'; g.fillRect(0, i * s, N, 4);
      g.fillStyle = 'rgb(128,196,200)'; g.fillRect(0, i * s - 4, N, 4);
    }
  }, false);
  for (const t of [color, rough, normal]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(90, 90); }
  return { color, rough, normal };
}

/* ---------------- environment ---------------- */
const pmrem = new THREE.PMREMGenerator(renderer);
new RGBELoader().load('assets/hdri/dikhololo_night_1k.hdr', (hdr) => {
  scene.environment = pmrem.fromEquirectangular(hdr).texture; hdr.dispose();
}, undefined, () => {});

const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uHaze: { value: 1 }, uFlash: { value: 0 }, uFlashCol: { value: new THREE.Color(1, 0.85, 0.6) } },
  vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `varying vec3 vP;uniform float uHaze,uFlash;uniform vec3 uFlashCol;
    void main(){float y=vP.y;
      vec3 top=vec3(.002,.003,.012),mid=vec3(.006,.008,.028),hz=vec3(.028,.016,.014);
      vec3 c=mix(mid,top,smoothstep(0.,.6,y));c+=hz*uHaze*exp(-abs(y)*9.);
      c+=uFlashCol*uFlash*exp(-abs(y-0.05)*8.)*0.28;
      gl_FragColor=vec4(c,1.);}`,
}));
scene.add(sky);

const starGeo = new THREE.BufferGeometry();
{ const p = new Float32Array(Q.stars * 3), ph = new Float32Array(Q.stars);
  for (let i = 0; i < Q.stars; i++) {
    const u = Math.random() * .92 + .06, th = Math.random() * Math.PI * 2, r = 800, s = Math.sqrt(1 - u * u);
    p.set([Math.cos(th) * s * r, u * r, Math.sin(th) * s * r], i * 3); ph[i] = Math.random() * 100;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  starGeo.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
}
const starMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uMap: { value: spriteTex } },
  vertexShader: 'attribute float phase;uniform float uTime;varying float vA;void main(){vA=.45+.55*sin(uTime*(.6+fract(phase)*1.4)+phase);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=(1.2+fract(phase*7.)*2.2);gl_Position=projectionMatrix*mv;}',
  fragmentShader: 'uniform sampler2D uMap;uniform float uOpacity;varying float vA;void main(){gl_FragColor=vec4(vec3(1.2,1.15,1.05)*texture2D(uMap,gl_PointCoord).a*vA*uOpacity,1.);}',
});
const starsPts = new THREE.Points(starGeo, starMat); scene.add(starsPts);

const moon = new THREE.Group();
moon.add(new THREE.Mesh(new THREE.SphereGeometry(14, 48, 24), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff1d6, emissiveIntensity: 1.1, roughness: 1, fog: false })));
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex, color: 0x9fb4ff, transparent: true, opacity: .1, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
halo.scale.setScalar(120); moon.add(halo);
moon.position.set(-260, 330, -620); scene.add(moon);
const moonLight = new THREE.DirectionalLight(0x9fb0ff, 0.35); moonLight.position.copy(moon.position); scene.add(moonLight);
scene.add(new THREE.HemisphereLight(0x1a2240, 0x120806, 0.25));

const city = new THREE.Group(); scene.add(city);
const cityMats = [];
{ const winTex = canvasTex(64, 128, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 64, 128);
    for (let y = 4; y < 128; y += 10) for (let x = 4; x < 64; x += 10) if (Math.random() > .35) {
      g.fillStyle = Math.random() > .9 ? '#ffff99' : '#ffcc66'; g.fillRect(x, y, 5, 6);
    }
  });
  winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping;
  for (let i = 0; i < 46; i++) {
    const w = 8 + Math.random() * 14, h = 20 + Math.random() * 60, d = 8 + Math.random() * 10;
    const t = winTex.clone(); t.needsUpdate = true; t.repeat.set(w / 10, h / 14);
    const mat = new THREE.MeshStandardMaterial({ color: 0x07080c, roughness: .9, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.6 });
    cityMats.push(mat);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(-260 + i * 11.5 + Math.random() * 4, h / 2, -150 - Math.random() * 70); city.add(m);
  }
}
let cityFlash = 0;

/* ---------------- ground ---------------- */
const ground = new THREE.Group(); scene.add(ground);
let reflector = null;
const tm = tileMaps();
const tileMat = new THREE.MeshStandardMaterial({
  map: tm.color, roughnessMap: tm.rough, normalMap: tm.normal, normalScale: new THREE.Vector2(.6, .6),
  roughness: 1, metalness: 0, envMapIntensity: .6, transparent: Q.reflector, opacity: Q.reflector ? .8 : 1,
});
const tiles = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), tileMat); tiles.rotation.x = -Math.PI / 2; ground.add(tiles);
function addReflector() {
  reflector = new Reflector(new THREE.PlaneGeometry(4000, 4000), {
    textureWidth: Math.max(256, innerWidth * .5), textureHeight: Math.max(256, innerHeight * .5),
    color: 0x6a6a72, clipBias: .003,
  });
  reflector.rotation.x = -Math.PI / 2; reflector.position.y = -0.02; ground.add(reflector);
}
if (Q.reflector) addReflector();

/* ---------------- props ---------------- */
const props = new THREE.Group(); scene.add(props);
const clay = new THREE.MeshStandardMaterial({ color: 0x8a3a1a, roughness: .78, metalness: 0 });
const oil = new THREE.MeshPhysicalMaterial({ color: 0x3a2405, roughness: .1, clearcoat: 1 });
const diyaGeo = new THREE.LatheGeometry([[0, 0], [.55, .02], [.9, .2], [1.15, .55], [1.2, .62], [1.05, .6], [.85, .32], [0, .28]].map(([x, y]) => new THREE.Vector2(x, y)), 40);
const flames = [], diyaLights = [];
const flameTex = canvasTex(64, 128, (g) => {
  const r = g.createRadialGradient(32, 88, 2, 32, 80, 34);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,220,150,.85)');
  r.addColorStop(.7, 'rgba(255,140,40,.25)'); r.addColorStop(1, 'rgba(255,100,20,0)');
  g.fillStyle = r; g.beginPath(); g.moveTo(32, 4); g.bezierCurveTo(52, 50, 64, 80, 32, 124); g.bezierCurveTo(0, 80, 12, 50, 32, 4); g.fill();
});
function flameSprite() { return new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, color: new THREE.Color(4, 1.8, .5), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); }
function makeDiya(x, z, s = 1) {
  const g = new THREE.Group(); const b = new THREE.Mesh(diyaGeo, clay); g.add(b);
  const o = new THREE.Mesh(new THREE.CircleGeometry(.95, 24), oil); o.rotation.x = -Math.PI / 2; o.position.y = .5; g.add(o);
  const f = flameSprite(); f.position.set(.8, 1.05, 0); f.scale.set(.5, .95, 1); g.add(f); flames.push(f);
  const core = flameSprite(); core.material.color.setRGB(8, 6, 3); core.position.copy(f.position); core.scale.set(.18, .4, 1); g.add(core); flames.push(core);
  g.position.set(x, 0, z); g.scale.setScalar(s); g.rotation.y = Math.random() * 6; props.add(g); return g;
}
const anarMat = new THREE.MeshStandardMaterial({
  color: 0xc89a3a, metalness: .55, roughness: .35,
  map: canvasTex(256, 256, (g) => {
    g.fillStyle = '#d4a240'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) { g.fillStyle = '#b11d2c'; g.fillRect(0, y, 256, 10); g.fillStyle = '#1f6b3a'; g.fillRect(0, y + 14, 256, 4); }
  }),
});
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
  for (let i = 0; i < Q.diyaLights; i++) {
    const g = diyaGroups[Math.round(i * (n - 1) / Math.max(1, Q.diyaLights - 1))];
    const l = new THREE.PointLight(0xff9a3c, 6, 14, 2); l.position.set(g.position.x, 1.3, g.position.z); props.add(l); diyaLights.push(l);
  }
  anar.position.set(-span * .3, 1.7, -2); anarLight.position.set(-span * .3, 4, -2);
  chakri.position.set(span * .27, .15, 1); chakriLight.position.set(span * .27, 1.5, 1);
  bottle.position.set(span * .12, 1.1, -4); decoRocket.position.set(span * .12, 2.6, -4); decoRocket.rotation.z = -.12;
}

/* ---------------- HDR particle renderer (instanced-feel via dynamic buffers) ---------------- */
const P = Q.maxPoints;
const pPos = new Float32Array(P * 3), pCol = new Float32Array(P * 3), pSize = new Float32Array(P);
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('size', new THREE.BufferAttribute(pSize, 1).setUsage(THREE.DynamicDrawUsage));
const pMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uMap: { value: spriteTex }, uScale: { value: 1 }, uTime: { value: 0 } },
  vertexShader: `attribute float size;attribute vec3 color;varying vec3 vC;uniform float uScale;
    void main(){vC=color;vec4 mv=modelViewMatrix*vec4(position,1.);
      gl_PointSize=max(1.2,size*uScale/-mv.z);gl_Position=projectionMatrix*mv;}`,
  // Soft core + hot corona; HDR values survive ACES.
  fragmentShader: `varying vec3 vC;
    void main(){vec2 p=gl_PointCoord-0.5;float d=length(p)*2.;if(d>1.)discard;
      float core=pow(max(0.,1.-d*2.8),3.);
      float soft=pow(1.-d,2.4);
      float a=soft*0.85+core*1.4;
      gl_FragColor=vec4(vC*a,1.);}`,
});
const pts = new THREE.Points(pGeo, pMat); pts.frustumCulled = false; scene.add(pts);
let pN = 0, pCap = P;
function emit(x, y, z, r, g, b, size) {
  if (pN >= pCap) return;
  const i = pN++; pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z;
  pCol[i * 3] = r; pCol[i * 3 + 1] = g; pCol[i * 3 + 2] = b; pSize[i] = size;
}
const colorCache = new Map();
function col(str) {
  let c = colorCache.get(str);
  if (!c) { c = new THREE.Color(str); colorCache.set(str, c); if (colorCache.size > 4000) colorCache.clear(); }
  return c;
}

/* Velocity-stretched streak ribbons (instanced billboards along velocity). */
const MAX_STREAKS = MOBILE ? 400 : 1400;
const streakDummy = new THREE.Object3D();
const streakColAttr = new Float32Array(MAX_STREAKS * 3);
const streakGeo = new THREE.PlaneGeometry(1, 1);
const streakMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uMap: { value: streakTex } },
  vertexShader: `attribute vec3 instanceColor;varying vec3 vC;varying vec2 vUv;
    void main(){vUv=uv;vC=instanceColor;
      vec4 mv=modelViewMatrix*instanceMatrix*vec4(position,1.);
      gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `uniform sampler2D uMap;varying vec3 vC;varying vec2 vUv;
    void main(){float a=texture2D(uMap,vUv).a;if(a<.02)discard;gl_FragColor=vec4(vC*a*1.8,1.);}`,
});
streakGeo.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(streakColAttr, 3).setUsage(THREE.DynamicDrawUsage));
const streaks = new THREE.InstancedMesh(streakGeo, streakMat, MAX_STREAKS);
streaks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
streaks.frustumCulled = false; streaks.count = 0; scene.add(streaks);
let streakN = 0;
const _qx = new THREE.Quaternion(), _qy = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _dir = new THREE.Vector3(), _right = new THREE.Vector3(1, 0, 0);
function emitStreak(x, y, z, vx, vy, vz, r, g, b, len, thick) {
  if (!Q.streaks || streakN >= MAX_STREAKS || len < 0.15) return;
  const i = streakN++;
  _dir.set(vx, vy, vz); const spd = _dir.length(); if (spd < 1e-4) { streakN--; return; }
  _dir.multiplyScalar(1 / spd);
  streakDummy.position.set(x - _dir.x * len * 0.35, y - _dir.y * len * 0.35, z - _dir.z * len * 0.35);
  streakDummy.scale.set(len, thick, 1);
  // Orient plane so its +X aligns with velocity, facing camera-ish via lookAt trick on Y.
  streakDummy.quaternion.setFromUnitVectors(_right, _dir);
  streakDummy.updateMatrix();
  streaks.setMatrixAt(i, streakDummy.matrix);
  streakColAttr[i * 3] = r; streakColAttr[i * 3 + 1] = g; streakColAttr[i * 3 + 2] = b;
}

/* Temperature ramp: white-hot core → metal-salt hue → ember orange as it cools (by alpha). */
const _tmpC = new THREE.Color(), _ember = new THREE.Color(1.0, 0.28, 0.05), _hot = new THREE.Color(1.6, 1.45, 1.2);
function tempColor(base, alpha, outR, outG, outB, i3) {
  // age ~ 1-alpha; early = hot white mixed into salt color, late = ember.
  const hot = Math.max(0, (alpha - 0.72) / 0.28);
  const cool = Math.max(0, 1 - alpha / 0.45);
  _tmpC.copy(base);
  if (hot > 0) _tmpC.lerp(_hot, hot * 0.85);
  if (cool > 0) _tmpC.lerp(_ember, cool * 0.9);
  const boost = 3.6 * alpha + hot * 2.8 + 0.35;
  pCol[i3] = _tmpC.r * boost; pCol[i3 + 1] = _tmpC.g * boost; pCol[i3 + 2] = _tmpC.b * boost;
}

const sparks = []; const MAXS = MOBILE ? 1500 : 4500;
function spark(x, y, z, vx, vy, vz, life, c, size = .5, drag = 1.2, grav = 9, flags = 0) {
  if (sparks.length < MAXS) sparks.push({ x, y, z, vx, vy, vz, life, max: life, c, size, drag, grav, flags });
}

const smokes = [];
const smokeMatProto = new THREE.SpriteMaterial({
  map: smokeTex, color: 0x8a8a96, transparent: true, depthWrite: false, opacity: 0, fog: true,
});
function smoke(x, y, z, tint) {
  if (smokes.length > (MOBILE ? 10 : 24)) { const s = smokes.shift(); scene.remove(s.s); s.s.material.dispose(); }
  const mat = smokeMatProto.clone();
  // Soft ash plume: small, desaturated, barely tinted by the burst
  mat.map = smokeTex;
  mat.color.copy(tint).lerp(new THREE.Color(0x555560), 0.985);
  mat.opacity = 0;
  const s = new THREE.Sprite(mat);
  s.position.set(x, y, z); s.material.rotation = Math.random() * 6;
  const baseScale = 1.2 + Math.random() * 0.4; s.scale.setScalar(baseScale); s.userData.baseScale = baseScale; scene.add(s);
  smokes.push({
    s, t: 0, life: 4.5 + Math.random() * 2.5,
    vx: (Math.random() - 0.5) * 0.45, vy: 0.25 + Math.random() * 0.3,
    g: 0.9 + Math.random() * 1.2, tint: tint.clone(), base: mat.color.clone(),
  });
}

const bLights = Array.from({ length: Q.burstLights }, () => {
  const l = new THREE.PointLight(0xffffff, 0, 140, 1.55); scene.add(l); return { l, t: 9, max: 1 };
});
let bIdx = 0;
function burstLight(x, y, z, c) {
  const b = bLights[bIdx++ % bLights.length];
  b.l.position.set(x, y, z); b.l.color.copy(c); b.t = 0; b.max = 1.05;
}

/* Camera shake + skyline / haze flash driven by bursts. */
let shakeAmp = 0, shakeDecay = 2.4;
const pendingCrackles = [];

function triggerBurstFX(wx, wy, wz, c, style) {
  burstLight(wx, wy, wz, c);
  smoke(wx, wy, wz - 1, c);
  if (!MOBILE && Math.random() > 0.35) smoke(wx + (Math.random() - 0.5) * 2, wy - 0.8, wz - 1.5, c);
  // Distance-weighted camera shake (closer / higher = stronger).
  const dx = wx - camera.position.x, dy = wy - camera.position.y, dz = wz - camera.position.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const amp = Math.min(0.7, 28 / Math.max(6, dist));
  shakeAmp = Math.max(shakeAmp, amp);
  cityFlash = Math.min(0.55, Math.max(cityFlash, 0.25 + amp * 0.35));
  // Clamp haze pulse so overlapping bursts cannot bleach the night sky.
  const flashTarget = Math.min(0.18, 0.08 + amp * 0.12);
  sky.material.uniforms.uFlash.value = Math.min(0.18, Math.max(sky.material.uniforms.uFlash.value, flashTarget));
  sky.material.uniforms.uFlashCol.value.copy(c).lerp(new THREE.Color(1, 0.9, 0.75), 0.5);
  // Crackle / strobe sub-bursts (game VFX "secondary pops").
  if (Q.crackle) {
    const n = MOBILE ? 2 : 4 + ((style === 'chrysanthemum' || style === 'crossette') ? 3 : 0);
    for (let i = 0; i < n; i++) {
      pendingCrackles.push({
        t: 0.05 + Math.random() * 0.45 + i * 0.04,
        x: wx, y: wy, z: wz, c, style,
      });
    }
  }
  // Immediate glitter sparkle ring.
  const glitter = MOBILE ? 8 : 22;
  for (let i = 0; i < glitter; i++) {
    const th = Math.random() * Math.PI * 2, ph = (Math.random() - 0.5) * Math.PI, sp = 6 + Math.random() * 14;
    const vx = Math.cos(th) * Math.cos(ph) * sp, vy = Math.sin(ph) * sp * 0.7 + 2, vz = Math.sin(th) * Math.cos(ph) * sp;
    spark(wx, wy, wz, vx, vy, vz, 0.35 + Math.random() * 0.5, c, 0.22 + Math.random() * 0.2, 1.8, 11, 1);
  }
}

function fireCrackle(job) {
  const n = MOBILE ? 10 : 22;
  for (let i = 0; i < n; i++) {
    const th = Math.random() * Math.PI * 2, ph = (Math.random() - 0.5) * 1.2, sp = 4 + Math.random() * 12;
    spark(job.x, job.y, job.z,
      Math.cos(th) * Math.cos(ph) * sp, Math.sin(ph) * sp + 1, Math.sin(th) * Math.cos(ph) * sp,
      0.25 + Math.random() * 0.35, job.c, 0.18 + Math.random() * 0.25, 2.2, 14, 1);
  }
  // Tiny strobe flash
  burstLight(job.x + (Math.random() - 0.5) * 2, job.y + (Math.random() - 0.5) * 2, job.z, job.c);
  shakeAmp = Math.max(shakeAmp, 0.08);
}

/* ---------------- hook classic explosion ---------------- */
const classicCreateExplosion = window.createExplosion;
window.createExplosion = function (x, y, style) {
  const before = window.particles.length;
  classicCreateExplosion.call(this, x, y, style);
  const p = window.particles[before]; const c = p ? col(p.startColor) : new THREE.Color(1, 1, 1);
  const w = pxToWorld(x, y, new THREE.Vector3());
  triggerBurstFX(w.x, w.y, w.z, c, style || 'random');
  // Tag new particles for 3D-only extras (depth + glitter chance + willow drag).
  for (let i = before; i < window.particles.length; i++) {
    const q = window.particles[i];
    if (q._z === undefined) {
      const sp = Math.hypot(q.vx, q.vy);
      q._z = 0; q._vz = (Math.random() * 2 - 1) * sp * 0.55;
    }
    q._glitter = Math.random() > 0.82;
    q._born = performance.now();
    // Willow / peony flavour: extra drag or denser ember decay hint for renderer.
    if (style === 'willow') { q._willow = true; }
    if (style === 'peony') { q._peony = true; }
  }
};
const PI = window.Particle.prototype.init;
window.Particle.prototype.init = function (...a) {
  PI.apply(this, a);
  const sp = Math.hypot(this.vx, this.vy);
  this._z = 0; this._vz = (Math.random() * 2 - 1) * sp * 0.55;
  this._glitter = Math.random() > 0.85;
  this._born = performance.now();
};

/* ---------------- classic step ---------------- */
function resizeCanvas() {
  window.canvas.width = innerWidth; window.canvas.height = innerHeight; window.config.isMobile = innerWidth < 768;
  if (window.config.background === 'starry') window.initStars(); else if (window.config.background === 'city') window.initCity();
  renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight);
  softBloom.uniforms.uRes.value.set(innerWidth, innerHeight);
  setupCameras(); layoutProps();
  pMat.uniforms.uScale.value = innerHeight * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
}
const rocketMeshes = new Map();
function stepClassic() {
  const fw = window.fireworks;
  for (let i = fw.length - 1; i >= 0; i--) {
    const f = fw[i]; const exploded = f.update();
    if (exploded) { fw.splice(i, 1); window.createExplosion(f.x, f.y, window.selectedFireworkStyle || 'random'); }
  }
  const ps = window.particles;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i]; const dead = p.update();
    if (p._vz !== undefined) {
      // Extra air drag + slight random flutter for willow feel.
      let fr = window.config.friction;
      if (p._willow) fr *= 0.985;
      p._vz *= fr;
      if (p._willow) p._vz += (Math.random() - 0.5) * 0.04;
      p._z += p._vz;
    }
    if (dead) { ps.splice(i, 1); window.particlePool.release(p); }
  }
}

/* ---------------- render classic state in 3D ---------------- */
const wp = new THREE.Vector3(), wq = new THREE.Vector3();
function drawClassic(dt) {
  const s = pxScale;
  streakN = 0;
  const live = new Set();
  for (const f of window.fireworks) {
    live.add(f); let m = rocketMeshes.get(f);
    if (!m) { m = rocketMesh(); scene.add(m); rocketMeshes.set(f, m); }
    pxToWorld(f.x, f.y, wp); m.position.copy(wp);
    m.rotation.z = -Math.atan2(f.vx, -f.vy);
    const ex = m.position.x + Math.sin(m.rotation.z) * .9, ey = m.position.y - Math.cos(m.rotation.z) * .9;
    for (let k = 0; k < (REDUCE ? 1 : 3); k++) spark(ex, ey, wp.z, (Math.random() - .5) * 3, -2 - Math.random() * 3, (Math.random() - .5) * 3, .5 + Math.random() * .4, col('#ffb35a'), .35);
    f.trail.forEach((t, i) => {
      pxToWorld(t.x, t.y, wq); const a = (i / f.trail.length) * 2.4;
      emit(wq.x, wq.y, wq.z, a, a * .8, a * .5, .55);
    });
    emit(wp.x, wp.y, wp.z, 7, 5.5, 3.5, 1.15);
    if (Q.streaks) emitStreak(wp.x, wp.y, wp.z, f.vx * s, -f.vy * s, 0, 2.2, 1.2, 0.5, Math.min(2.2, Math.hypot(f.vx, f.vy) * s * 0.22), 0.12);
  }
  for (const [f, m] of rocketMeshes) if (!live.has(f)) {
    scene.remove(m); rocketMeshes.delete(f);
    spark(m.position.x, m.position.y, m.position.z, 0, 0, 0, .15, col('#fff4e0'), 3.5, 0, 0);
  }

  for (const p of window.particles) {
    let a = p.alpha;
    if (p.twinkle) a *= .5 + Math.sin(p.twinklePhase) * .5;
    // Glitter flicker (metal-flake strobe).
    if (p._glitter) a *= 0.35 + 0.65 * Math.abs(Math.sin(p.twinklePhase * 3.7 + (p._born || 0) * 0.01));
    if (a <= 0) continue;
    const c = col(p.color); pxToWorld(p.x, p.y, wp); const z = (p._z || 0) * s;
    const sizeMul = p._peony && a > 0.6 ? 2.8 : (a > .7 ? 2.6 : 2.0);
    const size = p.size * s * 2 * sizeMul;
    if (pN < pCap) {
      const i = pN; emit(wp.x, wp.y, wp.z + z, 0, 0, 0, size);
      tempColor(c, p.alpha, 0, 0, 0, i * 3);
      // Re-apply glitter / twinkle on the HDR color.
      const k = a / Math.max(0.001, p.alpha);
      pCol[i * 3] *= k; pCol[i * 3 + 1] *= k; pCol[i * 3 + 2] *= k;
    }
    // Velocity-stretched motion blur for fast sparks.
    if (Q.streaks) {
      const spd = Math.hypot(p.vx, p.vy, p._vz || 0);
      if (spd > 2.0 && a > 0.25) {
        const len = Math.min(2.4, spd * s * 0.32);
        const boost = a * 2.0;
        emitStreak(wp.x, wp.y, wp.z + z, p.vx * s, -p.vy * s, (p._vz || 0) * s,
          c.r * boost + a * 0.4, c.g * boost * 0.85 + a * 0.25, c.b * boost * 0.55 + a * 0.15, len, Math.max(0.05, p.size * s * 0.22));
      }
    }
    if (p.hasTrail && p.trail.length > 1) {
      for (let i = 0; i < p.trail.length - 1; i++) {
        const t = p.trail[i], ta = (i / p.trail.length) * t.alpha * .55 * 3;
        pxToWorld(t.x, t.y, wq);
        emit(wq.x, wq.y, wq.z + z * (.85 + .15 * i / p.trail.length), c.r * ta * 2.0, c.g * ta * 1.7, c.b * ta * 1.3, p.size * s * 2.1);
      }
    }
  }
  streaks.count = streakN;
  streaks.instanceMatrix.needsUpdate = true;
  streaks.geometry.attributes.instanceColor.needsUpdate = true;
}

/* ---------------- ambient décor ---------------- */
let chakriAngle = 0;
function ambient(dt, t) {
  const ap = anar.getWorldPosition(wp); const tip = ap.y + 1.7;
  const fl = .8 + Math.sin(t * 31) * .1 + Math.random() * .2; anarLight.intensity = (REDUCE ? 35 : 70) * fl;
  for (let k = 0; k < (REDUCE ? 2 : MOBILE ? 6 : 14); k++) {
    const sp = 9 + Math.random() * 9, th = Math.random() * Math.PI * 2, r = Math.random() * .28;
    spark(ap.x, tip, ap.z, Math.cos(th) * r * sp, sp, Math.sin(th) * r * sp, .7 + Math.random() * .9, col(Math.random() > .3 ? '#ffc46a' : '#fff2c8'), .38, .9, 11);
  }
  chakriAngle += dt * (REDUCE ? 2 : 14); chakri.rotation.y = chakriAngle;
  const cp = chakri.getWorldPosition(wq); chakriLight.intensity = 36 * (.7 + Math.random() * .3);
  for (let k = 0; k < (REDUCE ? 1 : MOBILE ? 3 : 6); k++) {
    const a = chakriAngle + k * 2.1, R = 1.5;
    spark(cp.x + Math.cos(a) * R, cp.y + .1, cp.z + Math.sin(a) * R, -Math.sin(a) * 9 + (Math.random() - .5) * 2, 1 + Math.random() * 2, Math.cos(a) * 9 + (Math.random() - .5) * 2, .4 + Math.random() * .3, col(k % 2 ? '#ffd27a' : '#ff7a3a'), .32, 1.5, 9);
  }
  flames.forEach((f, i) => { const j = .85 + Math.sin(t * 13 + i * 1.7) * .08 + Math.random() * .07; f.scale.y = (i % 2 ? .4 : .95) * j; });
  diyaLights.forEach((l, i) => l.intensity = 6 * (.85 + Math.sin(t * 11 + i) * .1 + Math.random() * .08));
}
function stepSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]; s.life -= dt; if (s.life <= 0) { sparks.splice(i, 1); continue; }
    if (s.target) {
      const e = 1 - Math.pow(1 - Math.min(1, (s.max - s.life) / (s.max * .8)), 3);
      s.x = s.ox + (s.target.x - s.ox) * e; s.y = s.oy + (s.target.y - s.oy) * e + Math.sin(e * Math.PI) * s.arc; s.z = s.oz + (s.target.z - s.oz) * e;
    } else {
      const d = Math.exp(-s.drag * dt); s.vx *= d; s.vy = s.vy * d - s.grav * dt; s.vz *= d;
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
      if (s.y < groundY + .05 && s.vy < 0) { s.y = groundY + .05; s.vy *= -.3; s.vx *= .6; s.vz *= .6; }
    }
    const lifeK = Math.min(1, s.life / s.max * 1.6);
    // Crackle sparks get strobe flicker.
    const flick = (s.flags & 1) ? (0.4 + 0.6 * (Math.random() > 0.3 ? 1 : 0.15)) : 1;
    const a = lifeK * 3.2 * flick;
    if (pN < pCap) {
      const idx = pN; emit(s.x, s.y, s.z, 0, 0, 0, s.size);
      tempColor(s.c, Math.min(1, s.life / s.max), 0, 0, 0, idx * 3);
      pCol[idx * 3] *= a / 3.2; pCol[idx * 3 + 1] *= a / 3.2; pCol[idx * 3 + 2] *= a / 3.2;
    }
    if (Q.streaks && !s.target) {
      const spd = Math.hypot(s.vx, s.vy, s.vz);
      if (spd > 5) emitStreak(s.x, s.y, s.z, s.vx, s.vy, s.vz, s.c.r * a * 0.7, s.c.g * a * 0.55, s.c.b * a * 0.4, Math.min(2.0, spd * 0.07), Math.max(0.04, s.size * 0.2));
    }
  }
}
function stepFx(dt) {
  for (const b of bLights) {
    b.t += dt; const e = Math.max(0, 1 - b.t / b.max);
    // Punchy flash then soft tail (game light cookie feel).
    b.l.intensity = 4200 * e * e * (0.55 + 0.45 * Math.sin(e * Math.PI));
  }
  // Light smoke with burst lights (approximate nearest).
  let brightest = 0, brightCol = null;
  for (const b of bLights) if (b.l.intensity > brightest) { brightest = b.l.intensity; brightCol = b.l.color; }
  for (let i = smokes.length - 1; i >= 0; i--) {
    const s = smokes[i]; s.t += dt; const k = s.t / s.life;
    if (k >= 1) { scene.remove(s.s); s.s.material.dispose(); smokes.splice(i, 1); continue; }
    s.s.position.x += s.vx * dt; s.s.position.y += s.vy * dt;
    const baseScale = s.s.userData.baseScale || 2.2;
    s.s.scale.setScalar(baseScale + s.g * Math.sqrt(k) * 1.15);
    const op = Math.sin(Math.min(1, k * 3.2) * Math.PI / 2) * (1 - k) * 0.07;
    const mat = s.s.material;
    mat.opacity = op;
    // Tiny warm kiss from nearby bursts — stay mostly grey ash
    const lit = Math.min(0.08, brightest / 12000);
    mat.color.copy(s.base);
    if (brightCol && lit > 0.02) mat.color.lerp(brightCol, lit);
  }
  // Pending crackles
  for (let i = pendingCrackles.length - 1; i >= 0; i--) {
    pendingCrackles[i].t -= dt;
    if (pendingCrackles[i].t <= 0) { fireCrackle(pendingCrackles[i]); pendingCrackles.splice(i, 1); }
  }
  // Skyline flash + sky haze pulse
  cityFlash = Math.max(0, cityFlash - dt * 2.8);
  const ei = 1.6 + cityFlash * 1.4;
  for (const m of cityMats) m.emissiveIntensity = ei;
  sky.material.uniforms.uFlash.value = Math.min(0.18, Math.max(0, sky.material.uniforms.uFlash.value - dt * 2.6));
  shakeAmp = Math.max(0, shakeAmp - dt * shakeDecay);
}

/* ---------------- ASCII intro ---------------- */
const pre = document.getElementById('ascii'), caption = document.getElementById('caption');
let COLS, ROWS, grid, ents, introT0, introRaf, phase = 'ascii';
const DIYA = ['  (  ', ' _)_ ', '\\___/'];
function asciiSize() {
  const fs = parseFloat(getComputedStyle(pre).fontSize);
  COLS = Math.min(140, Math.max(40, Math.floor(innerWidth / (fs * .62))));
  ROWS = Math.min(60, Math.max(24, Math.floor(innerHeight * .82 / (fs * 1.05))));
}
const put = (x, y, c) => { x |= 0; y |= 0; if (y >= 0 && y < ROWS && x >= 0 && x < COLS) grid[y][x] = c; };
function initAscii() {
  asciiSize(); ents = []; introT0 = performance.now(); const n = Math.max(3, Math.floor(COLS / 14));
  for (let i = 0; i < n; i++) ents.push({ k: 'diya', x: Math.round((i + .5) * COLS / n) - 2 });
  ents.push({ k: 'anar', x: Math.round(COLS * .22), sp: [] }, { k: 'chakri', x: Math.round(COLS * .75), y: ROWS - 6, a: 0 });
}
function asciiStep(dt, t) {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(' '));
  for (let i = 0; i < COLS * .4; i++) { const s = (i * 9301 + 49297) % 233280; if (((t / 400 + i) | 0) % 7) put(s % COLS, (s >> 3) % (ROWS / 2), '.'); }
  if (Math.random() < dt * .0012) ents.push({ k: 'rocket', x: 6 + Math.random() * (COLS - 12), y: ROWS - 4, vy: -(18 + Math.random() * 10), top: 3 + Math.random() * ROWS * .35 });
  const gY = ROWS - 3;
  for (const e of ents) {
    if (e.k === 'diya') DIYA.forEach((row, r) => [...row].forEach((c, j) => c !== ' ' && put(e.x + j, gY + r, r === 0 ? '()'[Math.random() * 2 | 0] : c)));
    if (e.k === 'anar') {
      [[-1, 1, '/'], [0, 1, '#'], [1, 1, '\\'], [-2, 2, '/'], [2, 2, '\\'], [-1, 2, '#'], [0, 2, '#'], [1, 2, '#']].forEach(([dx, dy, c]) => put(e.x + dx, gY + dy, c));
      for (let i = 0; i < 4; i++) e.sp.push({ x: e.x, y: gY, vx: (Math.random() - .5) * 10, vy: -(14 + Math.random() * 14), l: 1.6 });
      e.sp = e.sp.filter(s => (s.l -= dt / 1000) > 0);
      for (const s of e.sp) { s.vy += 22 * dt / 1000; s.x += s.vx * dt / 1000; s.y += s.vy * dt / 1000; put(s.x, s.y, s.l > 1.1 ? '*' : s.l > .5 ? '+' : '.'); }
    }
    if (e.k === 'chakri') { e.a += dt / 90; put(e.x, e.y, '@'); for (let r = 1; r <= 3; r++) for (let j = 0; j < 4; j++) { const a = e.a + j * Math.PI / 2 + r * .5; put(e.x + Math.cos(a) * r * 2, e.y + Math.sin(a) * r, r === 3 ? '*' : '~'); } }
    if (e.k === 'rocket') { e.y += e.vy * dt / 1000; put(e.x, e.y, '^'); put(e.x, e.y + 1, '|'); put(e.x, e.y + 2, ':'); put(e.x, e.y + 3, '.'); if (e.y <= e.top) { e.dead = true; ents.push({ k: 'burst', x: e.x, y: e.y, r: 0, ch: '*o+x#@'[Math.random() * 6 | 0] }); } }
    if (e.k === 'burst') { e.r += dt / 70; const R = e.r; for (let j = 0; j < 22; j++) { const a = j / 22 * Math.PI * 2; put(e.x + Math.cos(a) * R * 2, e.y + Math.sin(a) * R + R * R * .02, R > 9 ? '.' : R > 6 ? '+' : e.ch); } if (R > 12) e.dead = true; }
  }
  ents = ents.filter(e => !e.dead);
  const msg = 'S H U B H   D E E P A V A L I';
  if (t > 1200) [...msg].forEach((c, i) => i < (t - 1200) / 60 && put((COLS - msg.length) / 2 + i, Math.floor(ROWS * .55), c));
  pre.textContent = grid.map(r => r.join('')).join('\n');
}
function asciiLoop(now) {
  const t = now - introT0, dt = Math.min(50, now - (asciiLoop.l || now)); asciiLoop.l = now; asciiStep(dt, t);
  if (t > 6500 && !params.has('hold')) return dissolve(); introRaf = requestAnimationFrame(asciiLoop);
}

let introStart = 0;
function dissolve() {
  if (phase !== 'ascii') return; phase = 'dissolve'; cancelAnimationFrame(introRaf);
  const range = document.createRange(); range.selectNodeContents(pre); const tb = range.getBoundingClientRect();
  const lines = pre.textContent.split('\n'), cw = tb.width / COLS, chh = tb.height / lines.length;
  const wicks = flames.filter((_, i) => i % 2 === 0).map(f => f.getWorldPosition(new THREE.Vector3()));
  const anarTip = anar.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.7, 0)), ch = chakri.getWorldPosition(new THREE.Vector3());
  const gold = col('#ffcf6b');
  lines.forEach((l, y) => [...l].forEach((c, x) => {
    if (c === ' ') return;
    const o = pxToWorld(tb.left + (x + .5) * cw, tb.top + (y + .5) * chh, new THREE.Vector3());
    let tgt, colr = gold, arc = 2;
    if ('()'.includes(c)) { tgt = wicks[Math.random() * wicks.length | 0]; colr = col('#ffb04a'); }
    else if ('/\\#'.includes(c) && x < COLS * .4) tgt = anarTip;
    else if ('@~'.includes(c)) tgt = ch.clone().add(new THREE.Vector3((Math.random() - .5) * 3, .2, (Math.random() - .5) * 3));
    else if (c === '.' && y < ROWS * .5 || /[A-Z]/.test(c)) {
      tgt = new THREE.Vector3(o.x * 2.5 + (Math.random() - .5) * 30, o.y + 25 + Math.random() * 40, -120 - Math.random() * 80);
      arc = 6; colr = /[A-Z]/.test(c) ? col('#fff3c4') : col('#cfe0ff');
    } else tgt = new THREE.Vector3(o.x + (Math.random() - .5) * 20, groundY + .1, (Math.random() - .5) * 30);
    for (let k = 0; k < 2; k++) {
      const life = (REDUCE ? .9 : 2.4) + Math.random() * .6;
      sparks.push({ x: o.x, y: o.y, z: o.z, ox: o.x, oy: o.y, oz: o.z, target: tgt, arc: arc * (Math.random() - .3), life, max: life, c: colr, size: .55, flags: 0 });
    }
  }));
  document.body.classList.add('dissolve'); caption.textContent = '';
  introStart = performance.now();
  setTimeout(enterShow, REDUCE ? 600 : 2600);
}
function enterShow() {
  if (phase === 'show') return; phase = 'show';
  document.body.classList.remove('intro'); pre.remove();
  setTimeout(() => window.launchFirework(window.canvas.width / 2, window.canvas.height / 3), 500);
}

function mirrorTo2D() {
  composer.render();
  const c = window.canvas; c.getContext('2d').drawImage(glCanvas, 0, 0, c.width, c.height);
  setTimeout(() => c.getContext('2d').clearRect(0, 0, c.width, c.height), 500);
}
['captureBtn', 'shareBtn'].forEach(id => document.getElementById(id)?.addEventListener('click', mirrorTo2D, true));

/* ---------------- main loop ---------------- */
let last = performance.now(), acc = 0, fpsAvg = 60, perfT = 0, dprNow = Q.dpr;
let bloomStr = Q.bloomStrength, softAmt = softBloom.uniforms.uAmt.value;
const STEP = 1000 / 60;
function frame(now) {
  requestAnimationFrame(frame);
  const dtMs = Math.min(100, now - last); last = now; const dt = dtMs / 1000;
  if (phase === 'show') {
    window.updateFPS();
    if (window.performanceConfig.batterySaving && window.performanceConfig.frameCount % 2 === 0) return;
    acc += dtMs; let n = 0; while (acc >= STEP && n < 6) { stepClassic(); acc -= STEP; n++; } if (n >= 6) acc = 0;
    window.updateProfiler();
  }
  const e = phase === 'ascii' ? 0 : Math.min(1, (now - introStart) / (REDUCE ? 600 : 3200));
  // Keep night readable: base exposure + brief dimming when several bursts overlap.
  let burstEnergy = 0;
  for (const b of bLights) burstEnergy += Math.max(0, b.l.intensity);
  const overload = Math.min(0.55, burstEnergy / 12000);
  const baseExp = 0.88 * e * (2 - e);
  renderer.toneMappingExposure = Math.max(0.5, baseExp * (1 - overload * 0.7));
  // Soft plate only on quiet frames — overlapping bursts must not fog the sky.
  softBloom.uniforms.uAmt.value = overload > 0.12 ? 0 : softAmt;
  starMat.uniforms.uOpacity.value = e * (window.config.background === 'black' ? 0 : 1);
  starMat.uniforms.uTime.value = now / 1000;
  grade.uniforms.uTime.value = now / 7;
  pMat.uniforms.uTime.value = now / 1000;
  const bg = window.config.background;
  city.visible = bg === 'city'; moon.visible = bg !== 'black';
  moonLight.intensity = bg === 'black' ? .08 : .35;
  sky.material.uniforms.uHaze.value = bg === 'black' ? .06 : bg === 'city' ? 0.7 : 0.35;
  const ease = 1 - Math.pow(1 - e, 3), sway = REDUCE ? 0 : 1;
  // Base camera + distance-weighted shake (game hit-stop style).
  const sx = (Math.random() - 0.5) * shakeAmp * 2.2;
  const sy = (Math.random() - 0.5) * shakeAmp * 1.6;
  camera.position.set(
    baseCam.position.x + Math.sin(now / 9000) * 1.4 * sway + sx,
    baseCam.position.y + (1 - ease) * 8 + Math.sin(now / 7000) * .4 * sway + sy,
    baseCam.position.z - (1 - ease) * 30,
  );
  camera.lookAt(Math.sin(now / 9000) * .7 * sway, 16 - (1 - ease) * 2, 0);
  grade.uniforms.uShake.value.set(sx * 0.0015, sy * 0.0015);

  pN = 0; streakN = 0;
  if (phase !== 'ascii') { ambient(dt, now / 1000); drawClassic(dt); }
  stepSparks(dt); stepFx(dt);
  streaks.count = streakN;
  streaks.instanceMatrix.needsUpdate = true;
  if (streaks.geometry.attributes.instanceColor) streaks.geometry.attributes.instanceColor.needsUpdate = true;
  pGeo.setDrawRange(0, pN);
  for (const k of ['position', 'color', 'size']) { const a = pGeo.attributes[k]; a.clearUpdateRanges?.(); a.needsUpdate = true; }
  composer.render(dt);

  fpsAvg += ((1000 / Math.max(1, dtMs)) - fpsAvg) * .05; perfT += dtMs;
  if (perfT > 1500 && phase === 'show') {
    perfT = 0;
    const adaptive = document.getElementById('adaptiveQuality')?.checked !== false;
    if (adaptive) {
      if (fpsAvg < 48 && dprNow > .6) {
        dprNow = Math.max(.6, dprNow - .2); renderer.setPixelRatio(dprNow); composer.setPixelRatio(dprNow);
      } else if (fpsAvg < 42 && bloomStr > 0.35) {
        bloomStr = Math.max(0.35, bloomStr - 0.12); bloom.strength = bloomStr;
        softAmt = Math.max(0.03, softAmt - 0.03); softBloom.uniforms.uAmt.value = softAmt;
      } else if (fpsAvg < 38 && Q.streaks) {
        Q.streaks = false; streaks.visible = false;
      } else if (fpsAvg < 36 && pCap > P * 0.45) {
        pCap = Math.floor(pCap * 0.75);
      } else if (fpsAvg < 34 && reflector) {
        ground.remove(reflector); reflector = null; tileMat.transparent = false; tileMat.opacity = 1; tileMat.needsUpdate = true;
      } else if (fpsAvg > 58 && dprNow < Q.dpr) {
        dprNow = Math.min(Q.dpr, dprNow + .1); renderer.setPixelRatio(dprNow); composer.setPixelRatio(dprNow);
      } else if (fpsAvg > 56 && bloomStr < Q.bloomStrength) {
        bloomStr = Math.min(Q.bloomStrength, bloomStr + 0.1); bloom.strength = bloomStr;
      }
      pMat.uniforms.uScale.value = innerHeight * dprNow / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    }
  }
}

/* ---------------- boot ---------------- */
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
window.__kf3d = { scene, renderer, pxToWorld, get fps() { return fpsAvg; }, get points() { return pN; }, get shake() { return shakeAmp; } };
