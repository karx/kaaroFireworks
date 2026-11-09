// Headless UX smoke test (dev only, not shipped): desktop 1280x720 + mobile 390x844, msg / no msg / Hindi / injection probe.
// Usage: npm i playwright-core && BASE=http://127.0.0.1:8000 PFX=after SHOTS=./shots node tests/ux-smoke.mjs
// Prints a JSON report (page errors, dialogs, burst texts, HUD sizes) and writes screenshots.
import { chromium } from 'playwright-core';
const B = process.env.BASE, PFX = process.env.PFX || 'after';
const S = process.env.SHOTS || './shots';
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: true,
  args: ['--use-gl=angle','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
const report = {};
const shot = (p, n) => p.screenshot({ path: `${S}/${PFX}-${n}.png` });
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
async function page(name, url, vp, mobile, fn) {
  if (ONLY && !ONLY.includes(name)) return;
  const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  const p = await ctx.newPage(); const errs = []; let dialogs = 0;
  p.on('dialog', d => { dialogs++; d.dismiss(); });
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|plausible/.test(m.text())) errs.push('[console] ' + m.text()); });
  // record every text burst string
  await p.addInitScript(() => { window.__bursts = []; const iv = setInterval(() => { if (window.createTextExplosion && !window.__hooked && document.readyState !== 'loading') { window.__hooked = 1; const o = window.createTextExplosion; window.createTextExplosion = function (t) { window.__bursts.push(t); return o.apply(this, arguments); }; clearInterval(iv); } }, 5); });
  try {
    await p.goto(B + url, { waitUntil: 'load', timeout: 90000 });
    await p.addStyleTag({ content: '[data-netlify-deploy-id],iframe[title="Netlify Drawer"]{display:none!important}' });
    const r = await fn(p);
    report[name] = { ...r, bursts: await p.evaluate(() => window.__bursts), errs, dialogs, title: await p.title() };
  } catch (e) { report[name] = { fail: String(e), errs }; }
  await ctx.close();
}
const D = { width: 1280, height: 720 }, M = { width: 390, height: 844 };
const E = encodeURIComponent;
const hud = p => p.evaluate(() => [...document.querySelectorAll('.controls > *')].filter(n => n.offsetParent).map(n => { const r = n.getBoundingClientRect(); return [n.id || n.className, Math.round(r.width), Math.round(r.height), getComputedStyle(n).borderRadius]; }));

await page('landing-desktop-msg', '/?from=Kartik&to=Arshi&msg=' + E('Roshni Mubarak'), D, false, async p => {
  await p.waitForTimeout(1800); await shot(p, '01-landing-desktop-msg');
  await p.waitForFunction(() => (window.__bursts || []).length > 0, null, { timeout: 20000 }); await p.waitForTimeout(1600); await shot(p, '02-landing-desktop-msg-burst');
  return { greeting: await p.evaluate(() => document.querySelector('.kf-greeting')?.innerText), hud: await hud(p) };
});
await page('landing-desktop-nomsg', '/?from=Kartik&to=Arshi', D, false, async p => {
  await p.waitForFunction(() => (window.__bursts || []).length > 0, null, { timeout: 20000 }); await p.waitForTimeout(1600); await shot(p, '03-landing-desktop-nomsg-burst');
  return {};
});
await page('landing-mobile-hi', '/?from=' + E('कार्तिक') + '&to=' + E('अर्शी') + '&lang=hi', M, true, async p => {
  await p.waitForTimeout(1500); await shot(p, '04-landing-mobile-hindi');
  await p.waitForFunction(() => (window.__bursts || []).length > 0, null, { timeout: 20000 }); await p.waitForTimeout(1600); await shot(p, '05-landing-mobile-hindi-burst');
  return { greeting: await p.evaluate(() => document.querySelector('.kf-greeting')?.innerText), hud: await hud(p) };
});
await page('xss', '/?from=' + E('<img src=x onerror=alert(1)>Eve') + '&to=' + E('\u202Eevil\u202C' + 'x'.repeat(200)) + '&msg=' + E('<script>alert(2)</script>\u202E<b>hi</b>'), D, false, async p => {
  await p.waitForTimeout(4800);
  return { nodes: await p.evaluate(() => document.querySelectorAll('.kf-greeting img, .kf-greeting script, .kf-greeting b').length),
           msg: await p.evaluate(() => window.KF_PERSONAL.msg), text: await p.evaluate(() => document.querySelector('.kf-greeting')?.innerText) };
});
await page('share-desktop', '/', D, false, async p => {
  await p.evaluate(() => localStorage.clear());
  await p.click('#greetToggle'); await p.fill('#greetFrom', 'Kartik'); await p.fill('#greetTo', 'Arshi');
  if (await p.$('#greetMsg')) await p.fill('#greetMsg', 'Roshni Mubarak');
  await p.waitForTimeout(300); await shot(p, '06-share-panel-desktop');
  return { url: await p.textContent('#greetURL'), counter: await p.evaluate(() => document.querySelector('#greetMsgCount')?.textContent || null) };
});
await page('share-mobile', '/', M, true, async p => {
  await p.click('#greetToggle'); await p.fill('#greetFrom', 'कार्तिक'); await p.selectOption('#greetLang', 'hi');
  if (await p.$('#greetMsg')) await p.fill('#greetMsg', 'रोशनी मुबारक');
  await p.waitForTimeout(300); await shot(p, '07-share-panel-mobile');
  return { url: await p.textContent('#greetURL') };
});
await page('reel-desktop', '/', D, false, async p => {
  await p.waitForTimeout(1500); await shot(p, '08-landing-desktop-plain');
  await p.evaluate(() => document.querySelector('.kf-reel-card').click()); await p.waitForTimeout(2000); await shot(p, '09-reel-modal-desktop');
  const open = await p.evaluate(() => !document.querySelector('.kf-reel-modal').hidden);
  await p.keyboard.press('Escape');
  return { open, closed: await p.evaluate(() => document.querySelector('.kf-reel-modal').hidden) };
});
await page('reel-mobile', '/', M, true, async p => {
  await p.waitForTimeout(1200); await shot(p, '10-landing-mobile-plain');
  await p.evaluate(() => document.querySelector('.kf-reel-pill').click()); await p.waitForTimeout(1500); await shot(p, '11-reel-modal-mobile');
  return { open: await p.evaluate(() => !document.querySelector('.kf-reel-modal').hidden) };
});
await page('3d-desktop-msg', '/ascii-to-3d.html?from=Kartik&to=Arshi&msg=' + E('Roshni Mubarak'), D, false, async p => {
  await p.waitForTimeout(5200); await shot(p, '12-3d-desktop-intro');
  const ascii = await p.evaluate(() => document.getElementById('ascii')?.textContent || '');
  await p.waitForFunction(() => (window.__bursts || []).length > 0, null, { timeout: 20000 }); await p.waitForTimeout(2600); await shot(p, '13-3d-desktop-burst');
  return { asciiHasName: ascii.includes('Kartik'), hud: await hud(p) };
});
await page('3d-mobile-hi', '/ascii-to-3d.html?from=' + E('कार्तिक') + '&to=' + E('अर्शी') + '&lang=hi', M, true, async p => {
  await p.waitForTimeout(5000); await shot(p, '14-3d-mobile-hindi-intro');
  await p.waitForFunction(() => (window.__bursts || []).length > 0, null, { timeout: 20000 }); await p.waitForTimeout(2600); await shot(p, '15-3d-mobile-hindi-burst');
  return { hud: await hud(p) };
});
await page('focus', '/', D, false, async p => {
  await p.waitForTimeout(800); await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
  await shot(p, '16-landing-focus');
  return {};
});
await page('settings-desktop', '/', D, false, async p => {
  await p.waitForTimeout(800); await p.click('#settingsToggle'); await p.waitForTimeout(500); await shot(p, '17-settings-panel-desktop');
  return {};
});
await page('settings-mobile', '/ascii-to-3d.html', M, true, async p => {
  await p.evaluate(() => document.getElementById('skipIntro')?.click()); await p.waitForTimeout(1500);
  await p.evaluate(() => document.getElementById('shareToggle').click()); await p.waitForTimeout(500); await shot(p, '18-share-save-panel-mobile-3d');
  return {};
});
await b.close();
console.log(JSON.stringify(report, null, 1));
