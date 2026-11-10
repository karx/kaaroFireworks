---
name: kaaro-design-vfx
description: Design system, copy rules and Three.js/WebGL firework VFX for kaaroFireworks (pattaka). Use before changing any UI, HUD, panel, button, icon, greeting copy, CSS token, the 2D canvas show, or the ascii-to-3d Three.js scene (bloom, HDR, tone mapping, particles, performance tiers, reduced motion).
---

# kaaro-design-vfx

Rules for how pattaka looks, reads and renders. Source docs: [`DESIGN_SYSTEM.md`](../../../DESIGN_SYSTEM.md) (only the **UI 2026** section is current), [`PERFORMANCE_OPTIMIZATIONS.md`](../../../PERFORMANCE_OPTIMIZATIONS.md), [`MOBILE_UX_IMPROVEMENTS.md`](../../../MOBILE_UX_IMPROVEMENTS.md). Code wins over docs when they disagree.

## 1. Before you start

1. Read `css/hud.css` (tokens) and the page you're touching.
2. Decide the surface: classic 2D show (`index.html`, `js/fireworks.js`, `particles.js`, `config.js`) or 3D show (`ascii-to-3d.html`, `js/ascii-to-3d.js`). They share the simulation; the 3D module replaces only the renderer (`main.js`).
3. Ship it through `kaaro-pr-workflow` (branch, screenshots, PR, no merge).

## 2. UI 2026 design system (current)

**Sharp, dark, one accent.**

- `border-radius: 0` everywhere (enforced globally). No pills, soft cards, glass blur, or hover lift. The 2025 glassmorphism section of DESIGN_SYSTEM.md is legacy; don't copy from it.
- **Tokens only** — never hard-code colours or sizes that have a token:
  - colour: `--kf-ink`, `--kf-surface`, `--kf-surface-strong`, `--kf-field`, `--kf-line`, `--kf-line-strong`, `--kf-text`, `--kf-text-2`, `--kf-text-3`, `--kf-accent` (marigold `#ffb53d`), `--kf-accent-ink`, `--kf-accent-tint`, `--kf-ok`, `--kf-danger`
  - space: `--kf-s1..s8` (4px rhythm); type: `--kf-fs-xs..xl`, `--kf-track-caps`
  - size: `--kf-hud` 48px (every HUD control), `--kf-tap` 44px (minimum in-panel control)
- **Accent discipline:** one filled accent action per surface (Send wishes, Copy link, Send your own wishes). Everything else is dark surface + 1px line. Active/selected = accent border + tint, or a 2px accent bar.
- **Type:** eyebrows/panel titles 11px uppercase, 0.12em tracking; body and buttons 14–16px weight 600; greeting `clamp(38px, …, 80px)` weight 800.
- **Icons:** Lucide-style 24px stroke SVGs, square caps, miter joins, inlined once per page as `<symbol id="i-*">` in the sprite and used via `<svg class="kf-i"><use href="#i-name"/></svg>`. JS-built buttons use `window.kfIcon(name)`. A new icon goes into the sprite of **every** page that uses it. No icon fonts, no emoji as buttons.
- **Buttons:** text + icon on wide screens; at ≤1100px and ≤560px the HUD collapses to 48×48 icon-only buttons, which therefore **must** have an `aria-label` that starts with the visible label text (Lighthouse label-content-name-mismatch).
- **Motion in UI:** 150ms colour transitions only.
- **Focus:** `:focus-visible` → 2px solid accent outline, 2px offset, on every interactive element.

Semantic colour, not decoration (from kaaro-design's proportional-strip pattern): a colour means one thing everywhere — accent = primary action/selected, `--kf-ok`/`--kf-danger` = status. Don't reuse the accent for decoration.

## 3. Copy rules

- **The sky shows `msg`.** The firework text burst is `msg` from `?msg=` / the "Sky message" field, max 120 chars (graphemes counted, see `js/personalize.js`).
- **No `msg` → "Happy Diwali"** (`lang=en`) or **"शुभ दीपावली"** (`lang=hi`). Never fall back to names.
- **Names only in the overlay.** `from`, `to`, `for` render only in `.kf-greeting` ("Dear …," / "Happy Diwali from Kartik & Arshi" / "कार्तिक और अर्शी की ओर से …"). They never become a sky burst.
- All params pass `clean()` (length limits, bidi/control chars stripped) and are inserted as text nodes. Never `innerHTML` user input. `tests/ux-smoke.mjs` has an XSS/bidi probe — keep it passing.
- Hindi strings live in the `T.hi` table in `personalize.js`; add both languages together.
- Brand: the firework is a "pataka"; the site/host is "pattaka" (double t). Tone: warm, short, Indian-English; "Shubh Deepavali 2026".

## 4. Three.js / WebGL VFX (ascii-to-3d)

Three.js is **vendored** (`vendor/three/three.module.min.js` + `vendor/three/addons/…`) and loaded through the import map in `ascii-to-3d.html`. Add a new addon by vendoring the file there; no CDN, no npm.

Pipeline as built in `js/ascii-to-3d.js`:

| Stage | Technique |
|---|---|
| Intro | `<pre id="ascii">` ASCII crackers ~6.5s, then `dissolve()` into WebGL. `?hold` freezes the intro, `?phase=3d` skips it, `#skipIntro` skips on click |
| Renderer | `WebGLRenderer` (antialias off, `preserveDrawingBuffer` for screenshots), `ACESFilmicToneMapping`, `SRGBColorSpace` output, DPR capped (1.5 mobile / 2 desktop) |
| Lighting/env | HDRI `assets/hdri/dikhololo_night_1k.hdr` via `RGBELoader` + `PMREMGenerator`; moon light; a few dynamic burst/diya point lights (3/2 mobile, 8/5 desktop) |
| Particles | One `THREE.Points` with dynamic `BufferGeometry` (position/color/size), additive blending, `depthWrite:false`, HDR colour values (>1) so cores survive ACES and bloom; `setDrawRange(0, pN)` each frame |
| Streaks | `InstancedMesh` velocity streaks (`MAX_STREAKS` 400 mobile / 1400 desktop) |
| Post | `EffectComposer` → `RenderPass` → `UnrealBloomPass` (strength 0.45/0.55, radius 0.28/0.4, **threshold 0.68**) → soft-bloom `ShaderPass` → grade pass (chromatic aberration, shake) → `OutputPass` |
| Extras | Stars `Points`, halo/flame sprites, `Reflector` wet-tile ground (desktop only, `?noreflect` disables), volumetric-ish smoke, distance-weighted camera shake |

**Washout fix — keep these invariants** (commit `bc79bec`):
- Bloom threshold stays high (0.68) with modest strength/radius; don't "add glow" by lowering the threshold.
- Exposure dims under burst energy: `exposure = max(0.5, base × (1 − overload × 0.7))`, overload capped at 0.55.
- The soft-bloom plate turns **off** while bursts overlap (`overload > 0.12`).
- Sky haze flash clamped (≤0.18); dark sky dome; smoke small, grey, low opacity; burst lights weak enough that wet tiles don't bleach white.
- Test any VFX change with several overlapping bursts (finale / auto-show), not just one shell.

Game-dev style choices to follow for new effects: HDR colour + bloom instead of large sprites; temperature-based colour over lifetime (white-hot → colour → ember); one buffer per primitive type, no per-particle objects or allocations in the frame loop; fixed 60Hz sim step (`STEP`, max 6 catch-up steps) decoupled from render.

## 5. Performance budgets

- Target 60 fps desktop, ≥30 fps mid-range mobile. `MOBILE = innerWidth < 768 || pointer: coarse`.
- 3D caps (`Q` in `ascii-to-3d.js`): points 9 000 mobile / 28 000 desktop; stars 900 / 2 200; streaks 400 / 1 400. New effects must fit inside these, or add a `Q` entry with a mobile value.
- Adaptive ladder (every 1.5s, when Adaptive Quality is on) — degrade in this order, recover in reverse: DPR −0.2 (min 0.6) at <48 fps → bloom/soft-bloom down at <42 → streaks off at <38 → particle cap ×0.75 at <36 → drop reflector at <34. Recover DPR at >58, bloom at >56. Add new costly effects as a new rung, don't bypass the ladder.
- 2D show: object pool (200 pre-allocated), particle count 20–100 adaptive, battery saving = every other frame + 50% particles (see PERFORMANCE_OPTIMIZATIONS.md; its line numbers are out of date).
- No allocations in hot loops; reuse typed arrays; mark only changed attributes `needsUpdate`.
- Weight: `assets/hdri/*.hdr` is ~1.7 MB (RFC PR 3 plans to shrink it); don't add heavier assets without a lazy-load plan. Share image stays ≤ ~150 KB JPEG.

## 6. Accessibility and reduced motion

- `prefers-reduced-motion: reduce` **or** the in-app Reduced Motion toggle (`performanceConfig.reducedMotion`) must: disable 2D trails/twinkle; in 3D disable streaks, crackle, chromatic aberration and camera sway; show a still ASCII frame (caption "Reduced motion: still frame") and a short 600ms intro instead of 3.2s. New motion (shake, flashes, parallax) must check the same flags.
- Avoid full-screen flashes; keep large luminance jumps short (the exposure clamp helps — don't remove it).
- The 3D `#gl` canvas is `aria-hidden`; the classic canvas is `role="img"` with an `aria-label` that says how to launch. Meaningful state lives in DOM text (greeting, captions, buttons). Decorative SVGs get `aria-hidden="true" focusable="false"`.
- Touch targets ≥44px, HUD 48px; contrast ≥4.5:1 for text on `--kf-surface`; logical tab order; the Send wishes panel opens with focus on the Sky message field (regression-tested in `tests/ux-smoke.mjs`).
- `lang` on `<html>` follows `?lang` (`en-IN` / `hi`).

## 7. Done checklist

- [ ] Tokens used, radius 0, one accent action per surface, icons from the sprite
- [ ] Sky = `msg` or the Happy Diwali / शुभ दीपावली default; names only in overlay
- [ ] Desktop 1280×720 and mobile 390×844 screenshots, en + hi, with/without `msg`
- [ ] Multi-burst 3D frame not washed out; fps holds on mobile emulation
- [ ] Reduced motion (system + toggle) checked
- [ ] No new console errors; PR opened via `kaaro-pr-workflow`, not merged
