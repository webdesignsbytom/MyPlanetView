// check-site.mjs: loads a live site the way different devices would, with and
// without browser storage blocked, and reports anything that breaks.
//
// Setup (once, in this folder):
//   npm init -y && npm i playwright @babel/parser && npx playwright install chromium firefox webkit
// Run:
//   node check-site.mjs https://example.com https://example.com/contact
//
// Each URL is loaded as: desktop Chrome, Android phone (Chrome), desktop
// Firefox and iPhone (Safari engine), first normally, then with site storage
// blocked. Screenshots go to ./screenshots so you can eyeball each result.

import { chromium, firefox, webkit, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const urls = process.argv.slice(2);
if (!urls.length) {
  console.log('Usage: node check-site.mjs <url> [more urls]');
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const shotDir = path.join(here, 'screenshots');
fs.mkdirSync(shotDir, { recursive: true });

// A normal desktop Chrome identity. The default headless one can be served a
// different cached copy of the page by hosts that cache per browser.
const DESKTOP_CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

const PROFILES = [
  { name: 'Desktop Chrome', engine: chromium, options: { userAgent: DESKTOP_CHROME_UA, viewport: { width: 1366, height: 768 } } },
  { name: 'Android phone', engine: chromium, options: devices['Pixel 5'] },
  { name: 'Desktop Firefox', engine: firefox, options: { viewport: { width: 1366, height: 768 } } },
  { name: 'iPhone Safari', engine: webkit, options: devices['iPhone 13'] },
];

// What Chrome and Safari do when a visitor blocks site data: touching
// localStorage or sessionStorage throws. Firefox uses its real setting instead.
function blockStorage() {
  for (const key of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(window, key, {
      configurable: true,
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });
  }
}

async function runOne(url, profile, blocked) {
  const browser = await profile.engine.launch({
    headless: true,
    // Firefox's own "block all cookies" setting, which also blocks storage.
    firefoxUserPrefs: profile.engine === firefox && blocked ? { 'network.cookie.cookieBehavior': 2 } : undefined,
  });
  const context = await browser.newContext(profile.options);
  if (blocked && profile.engine !== firefox) await context.addInitScript(blockStorage);
  const page = await context.newPage();

  const host = new URL(url).host;
  const problems = [];
  page.on('pageerror', (e) => problems.push(`JS error: ${e.message.slice(0, 120)}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && new URL(r.url()).host === host && /\.(js|css)(\?|$)/.test(r.url())) {
      problems.push(`${r.status()} ${new URL(r.url()).pathname}`);
    }
  });

  let textChars = 0;
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(5000); // let the app start and any popups appear
    textChars = await page.evaluate(() => document.body.innerText.trim().length);
    const file = `${host}${new URL(url).pathname.replace(/\W+/g, '_')}-${profile.name.replace(/\s+/g, '-')}${blocked ? '-blocked' : ''}.png`;
    await page.screenshot({ path: path.join(shotDir, file) });
  } catch (e) {
    problems.push(`Did not load: ${e.message.split('\n')[0]}`);
  }
  await browser.close();

  if (textChars < 50) problems.push(`Page is blank (${textChars} characters of text)`);
  return { profile: profile.name, storage: blocked ? 'blocked' : 'normal', ok: problems.length === 0, problems };
}

let failures = 0;
for (const url of urls) {
  console.log(`\n${url}`);
  for (const profile of PROFILES) {
    for (const blocked of [false, true]) {
      const r = await runOne(url, profile, blocked);
      if (!r.ok) failures++;
      const label = `${r.profile} (storage ${r.storage})`.padEnd(36);
      console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${label}${r.problems.join('; ')}`);
    }
  }
}
console.log(`\n${failures ? `${failures} check(s) failed` : 'All checks passed'}. Screenshots: ${shotDir}`);
process.exitCode = failures ? 1 : 0;
