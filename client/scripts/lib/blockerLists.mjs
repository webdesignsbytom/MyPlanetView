// The filter lists the common ad and tracker blockers use (uBlock Origin's defaults, Brave's,
// AdGuard's, the cookie-notice lists), downloaded into node_modules/.cache/blocker-lists and
// kept for a week, then made into one matcher (lib/blockerRules.mjs). For
// scripts/check-blocker-names.mjs and tests/e2e-app/adBlockers.spec.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeMatcher, parseList } from './blockerRules.mjs';

const CLIENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const LIST_CACHE = path.join(CLIENT, 'node_modules/.cache/blocker-lists');
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const BLOCKER_LISTS = Object.freeze({
  easylist: 'https://easylist.to/easylist/easylist.txt',
  easyprivacy: 'https://easylist.to/easylist/easyprivacy.txt',
  'easylist-cookie': 'https://secure.fanboy.co.nz/fanboy-cookiemonster.txt',
  'fanboy-annoyance': 'https://secure.fanboy.co.nz/fanboy-annoyance.txt',
  'ublock-filters': 'https://ublockorigin.github.io/uAssets/filters/filters.txt',
  'ublock-privacy': 'https://ublockorigin.github.io/uAssets/filters/privacy.txt',
  'ublock-cookies': 'https://ublockorigin.github.io/uAssets/filters/annoyances-cookies.txt',
  'ublock-badware': 'https://ublockorigin.github.io/uAssets/filters/badware.txt',
  'adguard-base': 'https://filters.adtidy.org/extension/ublock/filters/2.txt',
  'adguard-tracking': 'https://filters.adtidy.org/extension/ublock/filters/3.txt',
  'adguard-cookies': 'https://filters.adtidy.org/extension/ublock/filters/18.txt',
  'adguard-annoyances': 'https://filters.adtidy.org/extension/ublock/filters/14.txt',
});

// Where the site's requests go: the dev server, the sites and the API, the media bucket, the domain
export const OUR_HOSTS = Object.freeze(['localhost', 'myplanetview.netlify.app', 'my-planet-view.vercel.app', 'r2.dev', 'myplanetview.com', 'www.myplanetview.com', 'api.myplanetview.com']);

async function download(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return res.text();
}

/**
 * Every list, from the cache while it's under a week old (`refresh`: download anyway). A list
 * that can't be downloaded uses its older copy when there is one. -> { matcher, missing: [names] }
 */
export async function loadBlockerMatcher({ refresh = false, log = () => {} } = {}) {
  fs.mkdirSync(LIST_CACHE, { recursive: true });
  const rules = [];
  const missing = [];
  await Promise.all(
    Object.entries(BLOCKER_LISTS).map(async ([name, url]) => {
      const file = path.join(LIST_CACHE, `${name}.txt`);
      const age = fs.existsSync(file) ? Date.now() - fs.statSync(file).mtimeMs : Infinity;
      let text = null;
      if (refresh || age > MAX_AGE_MS) {
        try {
          text = await download(url);
          fs.writeFileSync(file, text);
        } catch (err) {
          log(`Couldn't download ${name} (${err.message})${age < Infinity ? ': using the copy from before' : ''}`);
        }
      }
      if (text === null && fs.existsSync(file)) text = fs.readFileSync(file, 'utf8');
      if (text === null) missing.push(name);
      // One at a time: hundreds of thousands spread into push() overflow the stack
      else for (const rule of parseList(text, { list: name, ourHosts: OUR_HOSTS })) rules.push(rule);
    }),
  );
  return { matcher: makeMatcher(rules), missing };
}
