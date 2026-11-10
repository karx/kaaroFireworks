---
published: false
title: "Agent Guidelines — Kaaro Fireworks (pattaka)"
tags:
  - agents
  - reference
description: "How AI coding agents should orient in kaaroFireworks: stack facts, key files, how to run it, the PR rule, and which project skills to load."
date: 2026-11-10
layer: L2-System
maturity: BUDDING
para: SkillSurface
---

# Agent Guidelines — Kaaro Fireworks

> Read this before making any changes. It encodes context that isn't obvious from the code.

---

## Name and URL — "pattaka", double t

- Production: **https://pattaka.netlify.app** (double **t**). Every canonical, `og:url`, `twitter:url`, sitemap and share link uses this host.
- `pataka.netlify.app` (single t) is an **unrelated** site. Never link to it, test against it, or "fix" a URL to it.
- In copy, the firework itself is a "pataka"; the site and host are "pattaka". Don't normalise one into the other.

---

## Stack (current)

| Layer | Technology |
|---|---|
| Pages | Static multi-page HTML, no build step, no bundler. `package.json` exists for dev tooling only (tests); nothing in it is shipped |
| Classic show (`/`) | Vanilla JS on a 2D canvas (`js/config.js`, `fireworks.js`, `particles.js`, `main.js`) |
| 3D show (`/ascii-to-3d`) | Three.js (WebGL2) ES module, vendored in `vendor/three/` via an import map; post-processing with EffectComposer + UnrealBloom + ACES tone mapping, HDRI from `assets/hdri/` |
| UI | Plain CSS design tokens in `css/hud.css`, inline SVG icon sprite — no framework, no icon font |
| Multi-user rooms | Firebase Realtime Database (`js/sync.js`, see `FIREBASE_SETUP.md`) |
| Analytics | Plausible, snippet `pa-Smvin2iz-nv9DEN45YrF0.js` on every page, events via `js/analytics.js` |
| Hosting | Netlify, `publish = "."` (`netlify.toml`), short links in `_redirects`, real 404 via `404.html` |

The 2025 glassmorphism notes in `DESIGN_SYSTEM.md` ("Legacy notes") are stale; the **UI 2026** section at the top is current.

---

## Key Entry Points

| File | What it is |
|---|---|
| `index.html` | Classic show, landing banner, HUD, Send-wishes panel, OG/Twitter tags, Plausible snippet |
| `ascii-to-3d.html` + `js/ascii-to-3d.js` | ASCII intro that dissolves into the real-time 3D show (reuses classic sim, replaces only `main.js` rendering) |
| `about.html`, `404.html` | About page; "This pataka fizzled" 404 page |
| `js/personalize.js` | `?from=&to=&for=&msg=&lang=hi` personalised greetings, sanitising, the Send wishes share panel |
| `js/analytics.js` | Single wrapper around `window.plausible`; every event goes through `analytics.track()` |
| `js/ui.js` | Settings/share panels, screenshot, QR, performance toggles |
| `js/performance.js` | FPS monitor, adaptive quality, battery saving, reduced motion |
| `js/reel.js`, `js/reel-link.js`, `js/welcome.js` | Diwali reel modal, reel link, first-visit welcome overlay |
| `css/hud.css` | Design tokens (`--kf-*`) and the sharp HUD |
| `_redirects` | 302 short links `/ig /yt /fb /x /li /wa /tg /3d` with UTM params; **no `/*` catch-all** |
| `assets/og/diwali-2026-og.jpg` | 1200×630 share image used by every OG/Twitter card |
| `tests/ux-smoke.mjs` | Headless Playwright smoke test (desktop + mobile screenshots, console errors, XSS probe) |

---

## Run it locally

```bash
npm run serve                      # from the repo root (static server on :8000; `python3 -m http.server 8000` also works)
# http://localhost:8000/            classic show
# http://localhost:8000/ascii-to-3d.html?phase=3d   skip straight to 3D
```

Serve over HTTP — opening `file://` breaks the ES-module import map. Local servers don't apply `_redirects` or `404.html`; check those on the Netlify deploy preview. Checks: `npm ci && npm test` (headless Playwright smoke test, exits 1 on any page error; needs Chrome, set `CHROME=` if not auto-found), `npm run check:js` (syntax). Full routine: `.claude/skills/kaaro-pr-workflow/SKILL.md`.

---

## Source map

Derived from each file's header comment. If a file here disagrees with this table, the file wins; fix the table.

| File | Role |
|---|---|
| `js/config.js` | Global config, explosion types, preset shows, canvas setup |
| `js/fireworks.js` | Firework class, explosions, background rendering |
| `js/particles.js` | Particle class and pool |
| `js/main.js` | Animation loop, canvas resize, init (replaced by `ascii-to-3d.js` on the 3D page) |
| `js/audio.js` | Sample-based audio with spatial effects and per-style presets |
| `js/performance.js` | Object pooling, FPS monitor, adaptive quality |
| `js/ui.js` | All UI controls and panels |
| `js/sync.js` | Firebase room sync (see `FIREBASE_SETUP.md`) |
| `js/show-editor.js` | Timeline-based show sequencer |
| `js/personalize.js` | Personalised links and the Send wishes panel |
| `js/analytics.js` | Plausible wrapper and event helpers |
| `js/ascii-to-3d.js` | ASCII intro to three.js scene |
| `js/reel.js`, `js/reel-link.js`, `js/welcome.js` | Reel modal, reel link click tracking, first-visit overlay |
| `css/hud.css` | UI 2026 tokens and HUD (layered on `style.css`) |
| `css/ascii-to-3d.css`, `landing-3d-cta.css`, `reel-link.css`, `welcome.css` | Per-feature styles using the `hud.css` tokens |

Drift check: `ls js css` should list nothing this table omits.

---

## Critical Patterns

**Branch + PR, never merge.** Every change goes on a branch from the latest `main` and into a PR. **Never merge a PR, push to `main`, or enable auto-merge** — Kartik reviews and merges himself. Don't stack PRs on other PR branches: Netlify only builds deploy previews for PRs targeting `main`.

**Sky shows `msg`, names only in the overlay.** The firework text burst is `msg`; with no `msg` it is "Happy Diwali" (or "शुभ दीपावली" with `lang=hi`). `from`/`to`/`for` appear only in the greeting overlay, never in the sky.

**Untrusted query params.** All personalisation values go through `clean()` with length limits and are set as text, never `innerHTML`. Keep it that way.

**One analytics path.** Call `window.analytics?.track…()` — never `plausible()` directly — so the `page` prop and rate limiting apply.

**Sharp UI.** `border-radius: 0`, 48px HUD controls, one filled accent action per surface, SVG icons, no emoji buttons.

**Reduced motion is a feature.** Respect `prefers-reduced-motion` and the in-app toggle in both the 2D and 3D shows.

---

## Do Not

- Do not merge, push to `main`, or open stacked PRs
- Do not use or link `pataka.netlify.app` (single t)
- Do not add a `/*` catch-all to `_redirects`
- Do not add a build step, bundler, framework or CDN Three.js — vendor files live in `vendor/three/`
- Do not render user query params as HTML
- Do not reintroduce rounded/glass UI from the legacy design notes
- Do not commit screenshots, test output or `node_modules`

---

## Project skills

| Skill | Use when |
|---|---|
| [`kaaro-design-vfx`](.claude/skills/kaaro-design-vfx/SKILL.md) | Any UI, copy, design-token, Three.js / WebGL or firework VFX change |
| [`kaaro-pr-workflow`](.claude/skills/kaaro-pr-workflow/SKILL.md) | Any change at all: branching, local checks, PR, Netlify preview, sanity-check rubric |
| [`kaaro-analytics`](.claude/skills/kaaro-analytics/SKILL.md) | Adding or changing Plausible events, goals, or the snippet |

---

## Related

The Oct 2025 docs are historical: where they disagree with the code or this file, the code and this file win.

- `DESIGN_SYSTEM.md`, `PERFORMANCE_OPTIMIZATIONS.md`, `MOBILE_UX_IMPROVEMENTS.md`
- `SEO_OPTIMIZATION.md`, `SHARING_FEATURES.md`, `DEPLOYMENT_CHECKLIST.md`
- `ANALYTICS_IMPLEMENTATION.md`, `ANALYTICS_QUICKSTART.md`, `ANALYTICS_SETUP.md`
- `FIREBASE_SETUP.md`, `README.md`, `ROADMAP.md`
