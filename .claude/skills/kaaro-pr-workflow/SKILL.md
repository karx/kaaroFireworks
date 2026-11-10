---
name: kaaro-pr-workflow
description: The one way to ship any change in kaaroFireworks (pattaka) — branch from main, run local checks (HTML, links, console errors, headless screenshots), open a PR with gh, verify the Netlify deploy preview (redirects, short links, 404, OG/Twitter cards), and report the link. Never merge. Also holds the pass/fail sanity-check rubric for design, SEO and share cards. Use for every code or content change and for "sanity check" requests.
---

# kaaro-pr-workflow

**Hard rule:** never merge a PR, push to `main`, force-push someone else's branch, or enable auto-merge. Kartik reviews and merges. Your job ends at "PR open, preview verified, link reported".

Production: **https://pattaka.netlify.app** (double t). Preview: `https://deploy-preview-<N>--pattaka.netlify.app`. `pataka.netlify.app` (single t) is not ours.

## 1. Check repo state

```bash
gh auth status
git fetch origin --prune
git status --short            # must be clean, or work in a fresh clone / worktree
gh pr list --state open       # don't duplicate or collide with an open PR
```

If another agent is using a clone, make your own (`gh repo clone karx/kaaroFireworks /workspace/kf-<topic>`) or `git worktree add`.

## 2. Branch from latest main

```bash
git switch main && git pull --ff-only
git switch -c <type>/<topic>        # feat/…, fix/…, docs/…, perf/…, chore/…
```

**Never stack PRs.** Netlify builds deploy previews only for PRs whose base is `main`; a PR based on another PR branch gets no preview. If work depends on an unmerged PR, wait, or say in the PR that it overlaps #N and keep both based on `main`.

## 3. Make the change

- Follow `AGENTS.md`, plus `kaaro-design-vfx` (UI/copy/3D) and `kaaro-analytics` (events) as relevant.
- Small, reviewable commits with messages that say *why*.
- No build step exists; don't add one. Don't commit screenshots, `node_modules`, or test output.

## 4. Local checks

`package.json` holds dev tooling only (no build step). There is no linter config or CI yet. Run these yourself:

```bash
npm run serve &                                  # serve repo root on :8000

# a) HTML validity (report errors you introduced; pre-existing warnings are not blockers)
npx --yes html-validate index.html ascii-to-3d.html about.html 404.html

# b) Links and assets (internal only; skip external hosts)
npx --yes linkinator http://localhost:8000/ --recurse --skip "^(?!http://localhost)"

# c) JS syntax for touched files
for f in js/*.js; do node --check "$f" || echo "SYNTAX $f"; done   # Node 22+ auto-detects ES modules

# d) Console errors + screenshots, desktop 1280x720 and mobile 390x844
npm ci
BASE=http://localhost:8000 SHOTS=/workspace/kf-shots npm test   # exits 1 on page errors / dialogs / failed checks
```

`tests/ux-smoke.mjs` covers `/` with/without `msg`, Hindi, an XSS/bidi probe and the share panel, and prints a JSON report (`errs`, `dialogs`, `bursts`, HUD sizes). Pass = exit code 0 (`errs` empty (Plausible/network noise is filtered), `dialogs: 0`, sky bursts equal `msg` or the default. For pages it doesn't cover (`/ascii-to-3d.html?phase=3d`, `/about.html`, `/404.html`), take the same two viewport screenshots with Playwright and capture `pageerror` + `console.error`. Use `--use-gl=angle --enable-webgl --ignore-gpu-blocklist` for WebGL.

**Look at every screenshot** before pushing. Keep screenshots outside the repo (e.g. `/workspace/kf-shots/`).

Also run [`DEPLOYMENT_CHECKLIST.md`](../../../DEPLOYMENT_CHECKLIST.md) sections relevant to the change (functionality, share features, mobile, Lighthouse targets ≥90). Its "push to main" deploy step is superseded by this skill.

## 5. Push and open the PR

```bash
git push -u origin HEAD
gh pr create --base main --title "<clear title>" --body-file /tmp/pr-body.md
```

PR body: **What / Why**, **How to test** (preview URLs to click), **Screenshots** (describe or attach), **Checks run** with results, **Risks / follow-ups**, and the line "Not merging — for Kartik's review."

## 6. Verify the Netlify deploy preview

```bash
gh pr checks <N> --watch          # wait for netlify/pattaka/deploy-preview
P=https://deploy-preview-<N>--pattaka.netlify.app
```

| Check | Command / expectation |
|---|---|
| Pages | `curl -sI $P/ $P/ascii-to-3d.html $P/about.html` → 200 |
| 404 | `curl -s -o /dev/null -w '%{http_code}' $P/nope` → **404**, body "This pataka fizzled" |
| Short links | every rule in `_redirects` → **302** with that rule's target as `Location`: `grep -E '^/[a-z0-9]+ ' _redirects \| while read f t _; do echo "$f $(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' $P$f)"; done` |
| No catch-all | `_redirects` has no `/*` rule; unknown paths stay 404 |
| OG/Twitter | `curl -s $P/ \| grep -E 'og:|twitter:'` → `og:image` + `twitter:image` = `https://pattaka.netlify.app/assets/og/diwali-2026-og.jpg`, 1200×630, `summary_large_image`, `og:url`/canonical on pattaka |
| Share image | `curl -sI https://pattaka.netlify.app/assets/og/diwali-2026-og.jpg` → 200 `image/jpeg` (check `$P/assets/og/…` if the PR changes it) |
| Analytics | Plausible `pa-Smvin2iz-nv9DEN45YrF0.js` loads on each page (see `kaaro-analytics`) |
| Headers | `curl -sI $P/` shows `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` |

Re-run step 4d against `$P` (`BASE=$P`) for real-host screenshots. OG tags point at production by design, so card previews (opengraph.xyz, LinkedIn Post Inspector, X) only reflect a change after Kartik merges; say so.

## 7. Report

Reply with: PR link, preview link, what changed (one line per file/area), checks run with pass/fail, screenshot paths, and anything unsure or TODO. **Do not merge**, even if checks are green or someone says "looks good" — only Kartik's explicit approval to merge counts, and he usually merges himself.

---

## Sanity-check rubric (pass / fail)

Use for "sanity check" requests and before any feature work. Report-only: no code changes unless asked. Grade each line **PASS** or **FAIL** with evidence (URL, command output, screenshot path); a section passes only if all its lines pass.

### Design
- [ ] No horizontal scroll and no overlapping HUD at 1280×720 and 390×844
- [ ] All HUD controls 48px, panel controls ≥44px, `border-radius: 0`, one filled accent action per surface
- [ ] Icons render from the SVG sprite (no missing `<use>` targets, no emoji buttons)
- [ ] Sky burst = `msg`, or "Happy Diwali" / "शुभ दीपावली" with none; names only in the greeting overlay
- [ ] 3D multi-burst frame not washed out; reduced motion gives a still/short intro
- [ ] Zero console errors / page errors on `/`, `/ascii-to-3d.html`, `/about.html`, `/404.html`
- [ ] Visible `:focus-visible` ring; icon-only buttons have aria-labels

### SEO
- [ ] Unique `<title>` and meta description per page; `<html lang>` set
- [ ] `<link rel="canonical">` on https://pattaka.netlify.app (double t) for each page
- [ ] `sitemap.xml` lists live pages on pattaka; `robots.txt` `Sitemap:` points at **pattaka** (currently `kaarofireworks.netlify.app` → FAIL until RFC PR 2)
- [ ] Unknown path returns a real 404 status with `404.html`
- [ ] http → https redirects (check from a normal network)
- [ ] Lighthouse SEO ≥90 on `/`

### Share cards
- [ ] `og:title`, `og:description`, `og:url`, `og:image` (+ `secure_url`, `type`, `width` 1200, `height` 630, `alt`) on `/` and `/ascii-to-3d.html`
- [ ] `twitter:card=summary_large_image` with `twitter:image` + `twitter:image:alt`
- [ ] Image URL is absolute on pattaka and returns 200 `image/jpeg`, 1200×630, < ~300 KB
- [ ] Card validator preview (opengraph.xyz or similar) renders title, description and image
- [ ] Personalised link (`/?from=…&msg=…`) unfurls with the same card; short links (`/wa` etc.) resolve and keep the card
- [ ] Send wishes panel: copy link, WhatsApp and native share produce a pattaka URL with the right params

Summarise as a table `Area | Grade | Failing lines | Evidence`, then a short fix list ordered by impact. Don't start fixes until Kartik says go.
