// Would an ad or tracker blocker block any of the site's own requests? (27 Nov 2026, the user's
// wish: "the site should always load even with adblockers". An ad blocker blocked
// /src/utils/analytics/events.js on the dev server, and the whole site stayed blank.)
//
// Tests, against the lists the common blockers use (lib/blockerLists.mjs: EasyList, EasyPrivacy,
// uBlock Origin's, AdGuard's and the cookie-notice lists, cached for a week):
//   - every file the dev server serves at its own path: src/, public/, index.html and the
//     packages Vite has bundled (node_modules/.vite/deps);
//   - every API route (the server's mounts and routes) and the offer links (/go/...);
//   - every file of the media bucket (../media);
//   - with `--dist <folder>`, every file of a build instead (its names are neutral: vite.config.js).
// Exits 1, naming each address and the rule that blocks it.
//   --refresh         download the lists again, however new the cached copies
//   --require-lists   fail when a list can't be had (CI); otherwise a missing list is a warning
// Reads no env file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBlockerMatcher } from './lib/blockerLists.mjs';
import { requestTypeOf } from './lib/blockerRules.mjs';

const CLIENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = path.resolve(CLIENT, '..');
const DEV = 'http://localhost:5173';
const SITE = 'https://myplanetview.com';
const MEDIA = 'https://pub-media.r2.dev';

const args = process.argv.slice(2);
const distAt = args.indexOf('--dist');
const dist = distAt >= 0 ? path.resolve(args[distAt + 1] || '') : null;
const refresh = args.includes('--refresh');
const requireLists = args.includes('--require-lists');

const toUrl = (base, file) => `${base}/${file.split(path.sep).join('/')}`;

function filesIn(dir, { skip = [] } = {}) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesIn(full, { skip }));
    else out.push(full);
  }
  return out;
}

// The API: each router's mount (server.js) joined with its routes' paths, a :param as a word
function apiAddresses() {
  const server = path.join(ROOT, 'server/src');
  const app = fs.readFileSync(path.join(server, 'server.js'), 'utf8');
  const files = new Map([...app.matchAll(/import\s+(\w+)\s+from\s+'\.\/routes\/([\w.-]+)'/g)].map((m) => [m[1], m[2]]));
  const addresses = new Set();
  for (const [, mount, router] of app.matchAll(/app\.use\(\s*'([^']+)'\s*,\s*(?:[\w.]+\s*,\s*)*(\w+)\s*\)/g)) {
    addresses.add(`${SITE}${mount}`);
    const file = files.get(router);
    if (!file) continue;
    const source = fs.readFileSync(path.join(server, 'routes', file), 'utf8');
    for (const [, route] of source.matchAll(/\.(?:get|post|put|patch|delete|all|use)\(\s*'([^']+)'/g)) {
      addresses.add(`${SITE}${mount}${route === '/' ? '' : route}`.replace(/:\w+/g, 'abc123'));
    }
  }
  addresses.add(`${SITE}/api/auth/get-session`);
  addresses.add(`${SITE}/api/auth/sign-in/email`);
  return [...addresses].map((url) => ({ url, type: 'xmlhttprequest' }));
}

function addresses() {
  if (dist) {
    return filesIn(dist).map((file) => {
      const url = toUrl(SITE, path.relative(dist, file));
      return { url, type: requestTypeOf(url) };
    });
  }
  const list = [];
  const serve = (file, base = DEV, from = CLIENT) => {
    const url = toUrl(base, path.relative(from, file));
    list.push({ url, type: requestTypeOf(url) });
  };
  filesIn(path.join(CLIENT, 'src')).forEach((file) => serve(file));
  filesIn(path.join(CLIENT, 'public')).forEach((file) => serve(file, DEV, path.join(CLIENT, 'public')));
  serve(path.join(CLIENT, 'index.html'));
  filesIn(path.join(CLIENT, 'node_modules/.vite/deps'))
    .filter((file) => file.endsWith('.js'))
    .forEach((file) => list.push({ url: `${toUrl(DEV, path.relative(CLIENT, file))}?v=0a1b2c3d`, type: 'script' }));
  list.push(...apiAddresses());
  list.push({ url: `${SITE}/go/abc123?p=GALLERY`, type: 'document' });
  // The site's pages (utils/constants/routes.js), a code or id in theirs as a word
  const routes = fs.readFileSync(path.join(CLIENT, 'src/utils/constants/routes.js'), 'utf8');
  for (const [, page] of routes.matchAll(/['`](\/[a-z][^'`#]*)/g)) {
    list.push({ url: `${SITE}${page.replace(/\$\{[^}]*\}/g, 'abc123')}`, type: 'document' });
  }
  filesIn(path.join(ROOT, 'media')).forEach((file) => serve(file, MEDIA, path.join(ROOT, 'media')));
  return list;
}

const { matcher, missing } = await loadBlockerMatcher({ refresh, log: (line) => console.warn(`⚠ ${line}`) });
if (missing.length) {
  const message = `Ad-blocker lists not available: ${missing.join(', ')}`;
  if (requireLists) {
    console.error(`✖ ${message}`);
    process.exit(1);
  }
  console.warn(`⚠ ${message} (checked against the rest)`);
}

const checked = addresses();
const blocked = [];
for (const { url, type } of checked) {
  const rule = matcher.blockedBy(url, type);
  if (rule) blocked.push(`  ${url}\n    blocked by ${rule.list}: ${rule.raw}`);
}
if (blocked.length) {
  console.error(`✖ Ad blockers would block ${blocked.length} of the site's own addresses. Rename them (a file, a folder or a route):\n${blocked.join('\n')}`);
  process.exit(1);
}
console.log(`✔ Ad blockers: none of ${checked.length} addresses${dist ? ' in the build' : ''} blocked (${matcher.size} rules)`);
