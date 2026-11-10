# docs/

Long-form notes. The **current** sources of truth are in the repo root and in the code:

| Where | What |
|---|---|
| `AGENTS.md` (on PR #7 / main once merged) | Agent orientation, rules, source map |
| `README.md`, `ROADMAP.md`, `DESIGN_SYSTEM.md` (UI 2026 section) | Product and design |
| `js/`, `css/`, `_redirects`, `netlify.toml` | Behaviour. Code wins over any document. |

## archive/

Oct 2025 planning, summaries and wishlists (audio, shapes, refactor, image sync, setup). Each file carries a "Historical" banner. They describe how the project got here, not how it works now.

| File | Topic |
|---|---|
| `AUDIO_FEATURES`, `AUDIO_PRESETS_GUIDE`, `AUDIO_PROFILE_DESIGN`, `AUDIO_REVAMP_PLAN`, `AUDIO_VARIATIONS_SUMMARY`, `AUDIO_WISHLIST` | Audio system history and ideas (current code: `js/audio.js`) |
| `EXPLOSION_TYPES_WISHLIST`, `NEW_SHAPES_SUMMARY` | Firework shapes (current code: `js/config.js`, `js/fireworks.js`) |
| `REFACTORING` | Modular split of the original single file |
| `IMAGE_SYNC_PROPOSAL`, `SETUP_INSTRUCTIONS`, `USER_FEATURES` | Multi-user sync proposals and setup (current: `FIREBASE_SETUP.md`, `js/sync.js`) |

Still in the root on purpose, but partly stale (check the code first): `ANALYTICS_*.md` (snippets predate the Nov 2026 reset; see `js/analytics.js`), `DEPLOYMENT_CHECKLIST.md`, `SEO_OPTIMIZATION.md`, `SHARING_FEATURES.md`, `MOBILE_UX_IMPROVEMENTS.md`, `PERFORMANCE_OPTIMIZATIONS.md`, `WISHLIST.md` (linked from `about.html`).
