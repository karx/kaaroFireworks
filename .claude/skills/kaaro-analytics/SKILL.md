---
name: kaaro-analytics
description: Plausible analytics for kaaroFireworks (pattaka) — the required snippet on every page, the analytics.js wrapper, the event catalogue as it exists in code, naming and privacy rules, rate limiting, the dashboard goals to create, and how to verify events. Use when adding, renaming or removing an event, adding a page, touching the Plausible snippet, setting up goals, or debugging missing analytics.
---

# kaaro-analytics

Plausible, cookie-free. Background docs: [`ANALYTICS_IMPLEMENTATION.md`](../../../ANALYTICS_IMPLEMENTATION.md), [`ANALYTICS_QUICKSTART.md`](../../../ANALYTICS_QUICKSTART.md), [`ANALYTICS_SETUP.md`](../../../ANALYTICS_SETUP.md). **They predate the Nov 2026 reset:** their `data-domain` / `script.js` / `script.tagged-events.js` snippets and goal lists are stale. This skill and `js/analytics.js` are current.

## 1. The snippet — on every page

Exactly this, high in `<head>`, on every served page (`index.html`, `ascii-to-3d.html`, `about.html`, `404.html`, and any new page):

```html
<!-- Privacy-friendly analytics by Plausible -->
<script async src="https://plausible.io/js/pa-Smvin2iz-nv9DEN45YrF0.js"></script>
<script>
  window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
  plausible.init()
</script>
```

then, before page scripts, `<script src="js/analytics.js"></script>` (`/js/analytics.js` on `404.html`), and set `<body data-page="home|ascii|about|not_found">`.

- The `pa-…` script is site-specific (no `data-domain` attribute). Don't swap it for `script.js` or add a second snippet.
- The inline stub queues calls made before the async script loads — keep it.
- `generate-og-image.html` is a dev tool page and intentionally has no snippet.
- Check: `grep -L "pa-Smvin2iz-nv9DEN45YrF0" *.html` should list only `generate-og-image.html`.

## 2. How to send an event

Always go through the wrapper:

```js
window.analytics?.trackShareURLCopy('send_wishes');     // preferred: a named helper
window.analytics?.track('welcome_3d_click');             // ad-hoc, still via the wrapper
```

Never call `plausible()` directly. `analytics.track(name, props)` adds `page` (from `body[data-page]`, falling back to the path), tolerates a late stub, and swallows errors. Wrap calls in optional chaining / `try` so analytics can never break the show. Set `analytics.debug = true` in the console to log every event.

## 3. Naming and privacy rules

- `snake_case`, `object_action` (`room_create`, `share_url_copy`), ≤ 30 chars. Group families with a prefix (`reel_open`, `reel_download`).
- Names are a contract with dashboard goals: **renaming breaks a goal**. Add a new event instead, or update the goal in the same PR and say so.
- Props: low-cardinality strings only (`yes/no`, `on/off`, small enums, buckets). No names, messages, room IDs, URLs with query strings, free text or timestamps. Bucket numbers (volume to 10%, text length short/medium/long, durations, fps levels).
- Never send `from`, `to`, `for`, `msg` or their lengths beyond a bucket.
- Every new event gets a helper in `js/analytics.js` (with a comment of its props) and a row in the catalogue below.

## 4. Rate limiting

- `firework_launch` is batched: the first launch is sent at once, then at most one event per **5 s** (`FIREWORK_EVENT_INTERVAL_MS`) carrying `count` = launches it represents, plus `explosion_type`, `is_mobile`. The batch flushes on `pagehide` / `beforeunload`.
- `first_interaction` fires once per page load (`{ once: true }` listeners in `main.js`; a guard flag in `ascii-to-3d.js`).
- `fps_drop` only fires below 30 fps.
- Any new event that can fire on every tap, frame, slider move or sync message must be batched or debounced the same way. Plausible bills per event.

## 5. Event catalogue (as in code, Nov 2026)

`page` is added to every event. "Caller" = where it's fired from. `js/analytics.js` is authoritative; this table adds props and callers. Drift check — every name printed here must have a row below:

```bash
grep -ho "track('[a-z_]*'" js/*.js | sort -u
```
(`reel.js` calls `analytics.trackReel(action)`, which prefixes `reel_`, so `download`, `open`, `send_wishes` appear there and are catalogued as `reel_*`.)

| Event | Props | Caller |
|---|---|---|
| `first_interaction` | — | `main.js` (canvas click/touch), `ascii-to-3d.js` |
| `firework_launch` | `explosion_type`, `is_mobile`, `count` | classic launch (batched) |
| `auto_show_start` / `auto_show_stop` | — | auto launch toggle |
| `background_change` | `background_type` | settings |
| `audio_preset_change` | `preset` | settings |
| `volume_change` | `volume_level` (10% buckets) | settings |
| `reverb_change` | `reverb_level` (10% buckets) | settings |
| `explosion_type_change` | `type` | settings |
| `text_explosion_create` | `text_length` short/medium/long | text burst |
| `image_explosion_create` | `image_type` | image burst |
| `performance_mode_change` | `battery_saving`, `reduced_motion` | performance toggles |
| `fps_drop` | `fps_level` low/poor/critical | performance monitor |
| `menu_open` / `menu_close` | `menu_type` | panels |
| `room_create` | — | `sync.js` |
| `room_join` | `room_id_length` | `sync.js` |
| `room_leave`, `sync_firework_send`, `sync_firework_receive` | — | `sync.js` |
| `config_save` | `name_length` | Share & Save panel |
| `share_url_generate` | `source` settings/send_wishes, `method` copy/whatsapp/native | `ui.js`, `personalize.js` |
| `share_url_copy` | `source` | `ui.js`, `personalize.js` |
| `qr_code_generate` | — | `ui.js` |
| `screenshot_capture` | — | `ui.js` |
| `personalized_visit` | `lang`, `has_msg` | `personalize.js` (visit with `?from/msg`) |
| `reel_open` | `from` pill/card | `reel.js` |
| `reel_download`, `reel_send_wishes` | — | `reel.js` |
| `reel_link_click` | `placement` (from `data-placement`) | `reel-link.js` |
| `cta_3d_click` | — | landing 3D button (`index.html`) |
| `welcome_3d_click` | — | `welcome.js` |
| `ascii_skip_to_3d` | — | `#skipIntro` in `ascii-to-3d.js` |
| `session_duration` | `duration` short/medium/long | `beforeunload` |
| `404` | `path` | `404.html` |

Defined but **not called anywhere** today: `config_load` (`trackConfigLoad`), `about_page_view` (`trackAboutPageView`), `error` (`trackError`). Wire them up or delete them in a dedicated PR; don't assume they have data.

Refresh this table when events change:

```bash
grep -rn "analytics\(?\)\?\.track\|this\.track('" js/ *.html | grep -v vendor
```

Known gaps to flag, not silently fix: `404` sends the raw `path` (fine for 404s, but keep it path-only, no query); `session_duration` on `beforeunload` is unreliable on mobile.

## 6. Goals to create in Plausible

Site settings → Goals → Add goal → Custom event. The event name must match exactly; the display name is the label below.

| Goal (display name) | Custom event(s) |
|---|---|
| Lit a pataka | `first_interaction` |
| Shared | `share_url_copy`, `share_url_generate`, `qr_code_generate`, `screenshot_capture` |
| Started a room | `room_create` |
| Watched the 3D | `ascii_skip_to_3d` |
| Clicked back to reel | `reel_link_click` |

Plausible goals are one event each, so "Shared" is four goals (e.g. "Shared — copy", "Shared — link", "Shared — QR", "Shared — screenshot"), optionally grouped in a funnel. To break down by props (`source`, `method`, `placement`, `page`, `lang`), add them under Site settings → Custom properties. Creating goals is a dashboard change for Kartik (or an agent with his explicit go-ahead), not a code change.

Note: "Watched the 3D" via `ascii_skip_to_3d` only counts people who press Skip; visitors who sit through the intro aren't counted. Consider `cta_3d_click` + `/ascii-to-3d` pageviews alongside it.

## 7. Verify events

1. **Local / preview, network tab:** DevTools → Network, filter `plausible`. Expect `pa-Smvin2iz-nv9DEN45YrF0.js` 200, then `POST https://plausible.io/api/event` per event with payload `n` (name), `u` (url), `p` (props incl. `page`). Status 202 = accepted. Localhost hits may be ignored by Plausible; use the Netlify preview or production for real data.
2. **Console:** `analytics.debug = true`, then interact — each `Analytics track:` line shows name and props. `plausible.q` holds queued calls if the script was blocked.
3. **Realtime:** Plausible dashboard → "Realtime" (or "Current visitors"), trigger the event on production, and watch Goal Conversions / Custom events within ~1 min. Deploy-preview hosts count only if the site accepts them; otherwise verify after merge.
4. **Headless:** in Playwright, `page.on('request', r => r.url().includes('/api/event') && log(r.postData()))`; assert the expected `n` values. Block the request (`route.abort()`) in screenshot runs if you don't want test traffic in production stats.
5. Ad blockers block Plausible — test in a clean profile.

## 8. Done checklist

- [ ] Snippet present on every served page, exactly once; `data-page` set
- [ ] New event: helper in `analytics.js`, snake_case, low-cardinality props, rate-limited if high-frequency
- [ ] Catalogue table above updated in the same PR
- [ ] Goal names unchanged, or goal update called out in the PR body
- [ ] Event seen in the network tab on the deploy preview
- [ ] PR opened via `kaaro-pr-workflow`, not merged
