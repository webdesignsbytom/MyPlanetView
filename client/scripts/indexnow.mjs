// IndexNow (the SEO playbook's A2; the audit, 26 Nov 2026): tells Bing, Yandex, Seznam, Naver and
// Yep which of the live site's pages changed, from its own sitemap's lastmod. Run it after each
// deploy of the client, and the weekly GitHub Action (.github/workflows/indexnow.yml) runs it too:
//
//   npm run indexnow                 the pages changed in the last 8 days, on the real domain
//   npm run indexnow -- --all        every page in the sitemap (the first send after launch)
//   npm run indexnow -- --days 30    the pages changed in the last 30 days
//   npm run indexnow -- --live https://<the Netlify site>   another address
//   npm run indexnow -- --dry-run    say what would go, send nothing
//   npm run indexnow -- --quiet-if-not-live   a site that isn't up yet is a note, not a failure
//
// It checks the key file (public/<key>.txt, utils/seo/indexNow.js) answers on the site first, as
// IndexNow refuses a send it can't verify. It reads no env file. Bing Webmaster Tools' IndexNow
// page shows what arrived.
import { FULL_BUSINESS_URL } from '../src/utils/constants/constants.js';
import { INDEXNOW_ENDPOINT, INDEXNOW_KEY, indexNowBody, keyLocation, pagesToSend, sitemapEntries } from '../src/utils/seo/indexNow.js';

const args = process.argv.slice(2);
const option = (name) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : undefined;
};
const origin = (option('--live') || FULL_BUSINESS_URL).replace(/\/+$/, '');
const all = args.includes('--all');
const dryRun = args.includes('--dry-run');
const quiet = args.includes('--quiet-if-not-live');
const days = Number(option('--days') || 8);

// The site isn't answering: before launch that's expected (with --quiet-if-not-live)
function notLive(message) {
  if (quiet) {
    console.log(`::warning::IndexNow skipped: ${message}`);
    process.exit(0);
  }
  console.error(`✖ ${message}`);
  process.exit(1);
}

async function fetchText(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'IndexNow sender' } });
    return { status: res.status, text: res.ok ? await res.text() : '' };
  } catch (err) {
    return { status: 0, text: '', error: err.message };
  }
}

if (!Number.isFinite(days) || days <= 0) {
  console.error('✖ --days takes a number of days, e.g. --days 30');
  process.exit(1);
}

const sitemap = await fetchText(`${origin}/sitemap.xml`);
if (sitemap.status !== 200) notLive(`${origin}/sitemap.xml answered ${sitemap.status || sitemap.error}`);
const key = await fetchText(keyLocation(origin));
if (key.status !== 200 || key.text.trim() !== INDEXNOW_KEY) {
  notLive(`the key file ${keyLocation(origin)} answered ${key.status || key.error}${key.status === 200 ? ' without the key' : ''}`);
}

const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const entries = sitemapEntries(sitemap.text);
const urls = pagesToSend(entries, { origin, since, all });
if (!urls.length) {
  console.log(`Nothing to send: none of the sitemap's ${entries.length} pages changed in the last ${days} days (--all sends every page).`);
  process.exit(0);
}

console.log(`${urls.length} of the sitemap's ${entries.length} pages${all ? '' : `, changed in the last ${days} days`}:`);
for (const url of urls) console.log(`  ${url}`);
if (dryRun) {
  console.log('Dry run: nothing sent.');
  process.exit(0);
}

const res = await fetch(INDEXNOW_ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(indexNowBody(origin, urls)),
});
// 200: received; 202: received, the key still being checked; anything else: refused
if (res.status === 200 || res.status === 202) {
  console.log(`✅ IndexNow took ${urls.length} pages (${res.status}${res.status === 202 ? ', the key still being checked' : ''}).`);
} else {
  console.error(`✖ IndexNow answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
