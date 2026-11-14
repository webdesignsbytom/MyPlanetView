// Builds site-tests.html, the by-hand test of the whole site, from site-tests.json
// (both next to this file). Edit the JSON, then run from the repo root:
//
//   node documents/tests/buildSiteTests.mjs
//
// In the JSON, **bold** quotes the site's own wording, `code` marks values and
// addresses, {page:/path} links the page on the dev server (and the live site when
// `live` is set), and {build:/path} links it on the production build (npm run preview).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(HERE, 'site-tests.json');
const OUT = path.join(HERE, 'site-tests.html');

const data = JSON.parse(readFileSync(SOURCE, 'utf8'));

// Site settings (per project, in the JSON)
const LOCAL = data.local || 'http://localhost:5173';
const BUILD = data.build || 'http://localhost:4173';
const LIVE = data.live || null;
const PASSWORD = data.password || '';
const STORE = data.storageKey || 'site-tests';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const link = (url) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>`;

function pageLinks(route, bases) {
  // A route with a placeholder in it is not a page anybody can open
  if (/[[\]<>{}]/.test(route)) return `<code>${esc(route)}</code>`;
  return `<span class="pg">${bases.map((base) => link(`${base}${route}`)).join('')}</span>`;
}

/** **bold**, `code`, {page:/path} and {build:/path}, with everything else escaped. */
function inline(text) {
  const tokens = [];
  const hold = (html) => `\u0000${tokens.push(html) - 1}\u0000`;

  let out = String(text ?? '')
    .replace(/\{page:([^}]+)\}/g, (_, route) => hold(pageLinks(route.trim(), LIVE ? [LOCAL, LIVE] : [LOCAL])))
    .replace(/\{build:([^}]+)\}/g, (_, route) => hold(pageLinks(route.trim(), [BUILD])))
    .replace(/`([^`]+)`/g, (_, code) => hold(`<code>${esc(code)}</code>`));

  out = esc(out).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[Number(i)]);
}

const plain = (text) =>
  String(text ?? '')
    .replace(/\{(?:page|build):([^}]+)\}/g, '$1')
    .replace(/[*`]/g, '')
    .replace(/[^A-Za-z0-9 /.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 70);

const anchor = (id) => String(id).toLowerCase().replace(/[^a-z0-9]+/g, '-');

function step(s) {
  // An account made earlier in the tests has a description, not an address
  const account = s.who?.includes('@') ? `<code>${esc(s.who)}</code>` : esc(s.who);
  const password = PASSWORD ? ` &middot; password <code>${esc(PASSWORD)}</code>` : '';
  const who = s.who ? `<p class="who">Sign in as ${account}${password}</p>` : '<p class="who">Signed out</p>';
  const note = s.note ? `<p class="note">${inline(s.note)}</p>` : '';
  const doList = (s.do || []).map((item) => `<li>${inline(item)}</li>`).join('');
  const expectList = (s.expect || [])
    .map(
      (item) =>
        `<li><label><input type="checkbox" data-key="${esc(`${s.id}|${plain(item)}`)}"> <span>${inline(item)}</span></label></li>`,
    )
    .join('');

  return `<section class="step" id="${anchor(s.id)}">
<h3><span class="num">${esc(s.id)}</span>${inline(s.title)}</h3>
${who}${note}<h4>Do</h4><ol>${doList}</ol>
<h4>Expect</h4><ul class="check">${expectList}</ul>
</section>`;
}

function part(p, index) {
  const intro = p.intro ? `<p class="intro">${inline(p.intro)}</p>` : '';
  return `<h2 class="part" id="${anchor(p.id || p.part)}">Part ${index + 1} &middot; ${esc(p.part)}</h2>${intro}
${p.steps.map(step).join('\n')}`;
}

function toc() {
  const items = data.parts
    .map((p, index) => {
      const head = `<li class="head">Part ${index + 1} &middot; ${esc(p.part)}</li>`;
      const steps = p.steps
        .map((s) => `<li><a href="#${anchor(s.id)}"><span class="n">${esc(s.id)}</span>${inline(s.title)}</a></li>`)
        .join('');
      return head + steps;
    })
    .join('');
  return `<nav class="toc" aria-label="Contents"><b>Contents</b><ol><li><a href="#start"><span class="n">0</span>Before you start</a></li>${items}${
    data.found?.length ? '<li class="head">Found while writing these</li><li><a href="#found"><span class="n">!</span>Faults to fix</a></li>' : ''
  }</ol></nav>`;
}

function found() {
  if (!data.found?.length) return '';
  const rows = data.found
    .map((f) => `<div class="gap"><b>Fault</b><span>${inline(f.title)}</span><span>${inline(f.detail || '')}</span>${f.files ? `<code>${esc(f.files)}</code>` : ''}</div>`)
    .join('\n');
  return `<h2 class="part" id="found">Found while writing these tests</h2><p class="intro">Each was checked against the code. A step that fails because of one of these is not a new bug.</p>
${rows}`;
}

const stepCount = data.parts.reduce((n, p) => n + p.steps.length, 0);

const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(data.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&amp;family=IBM+Plex+Mono:wght@400;500;600&amp;display=swap">
<style>
:root {
  --ground: #f4f5f7; --surface: #ffffff; --sunk: #eaecef;
  --ink: #14171a; --ink-2: #3d444b; --ink-3: #626a73;
  --rule: #d8dce1; --rule-strong: #bcc3cb;
  --link: #1f6fb0; --good: #1f6f4d; --warn: #8a6218; --crit: #a83228;
}
@media (prefers-color-scheme: dark) {
  :root {
    --ground: #101215; --surface: #191c20; --sunk: #15181c;
    --ink: #eef0f2; --ink-2: #c3c9cf; --ink-3: #9aa1a9;
    --rule: #272b31; --rule-strong: #3a4149;
    --link: #7ab3e0; --good: #5fc796; --warn: #e0ab5a; --crit: #f18a7b;
  }
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--ground); color: var(--ink); font-family: "Public Sans", system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 16.5px; line-height: 1.65; -webkit-font-smoothing: antialiased; overflow-wrap: anywhere; }
.wrap { display: grid; grid-template-columns: 17rem minmax(0, 1fr); gap: 3.5rem; max-width: 84rem; margin: 0 auto; padding: 0 2rem; align-items: start; }
@media (max-width: 64rem) { .wrap { grid-template-columns: minmax(0, 1fr); gap: 2rem; padding: 0 1rem; } }
nav.toc { position: sticky; top: 0; max-height: 100vh; overflow-y: auto; padding: 3rem 0; border-right: 1px solid var(--rule); font-size: .8125rem; }
@media (max-width: 64rem) { nav.toc { position: static; max-height: none; border-right: 0; border-bottom: 1px solid var(--rule); padding: 2rem 0 1.25rem; } }
nav.toc b { display: block; font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .625rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); font-weight: 600; }
nav.toc ol { list-style: none; display: grid; gap: .3rem; margin-top: .9rem; }
nav.toc li.head { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .5875rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); padding-top: 1.1rem; }
nav.toc a { display: grid; grid-template-columns: 2.4rem minmax(0, 1fr); color: var(--ink-2); text-decoration: none; padding-right: .75rem; line-height: 1.45; }
nav.toc a:hover { color: var(--link); }
nav.toc .n { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .6875rem; color: var(--ink-3); }
main { padding: 3rem 0 7rem; min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 2.75rem; align-content: start; }
main > *, section.step > * { min-width: 0; }
header { display: grid; gap: .7rem; padding-bottom: 2rem; border-bottom: 2px solid var(--ink); }
h1 { font-size: clamp(2rem, 4.5vw, 2.9rem); line-height: 1.06; letter-spacing: -.03em; font-weight: 800; }
.sub { color: var(--ink-2); }
header .sub { font-size: 1.05rem; }
code { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .86em; background: var(--sunk); border: 1px solid var(--rule); border-radius: 4px; padding: .08em .35em; overflow-wrap: anywhere; }
a { color: var(--link); text-underline-offset: 2px; }
h2.part { display: grid; gap: .7rem; padding-top: 3.5rem; font-family: "IBM Plex Mono", ui-monospace, monospace; font-weight: 600; font-size: .6875rem; letter-spacing: .18em; text-transform: uppercase; color: var(--ink-3); }
h2.part::after { content: ""; height: 2px; background: var(--ink); }
section.step { display: grid; gap: .9rem; align-content: start; border-top: 1px solid var(--rule); padding-top: 2.75rem; }
h2.part + section.step, p.intro + section.step { border-top: 0; padding-top: 0; }
section.step > h3 { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .7rem; align-items: baseline; font-size: 1.2rem; letter-spacing: -.015em; font-weight: 700; }
section.step > h3 .num { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .75rem; font-weight: 600; letter-spacing: .08em; color: var(--ink-3); }
section.step h4 { font-family: "IBM Plex Mono", ui-monospace, monospace; font-weight: 600; font-size: .6875rem; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); padding-top: 1.15rem; }
section.step p, p.intro { color: var(--ink-2); }
section.step ol { display: grid; gap: .45rem; padding-left: 1.4rem; color: var(--ink-2); }
section.step ul { display: grid; gap: .35rem; padding-left: 1.15rem; color: var(--ink-2); }
ul.check { list-style: none; padding-left: 0 !important; }
ul.check label { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .6rem; align-items: start; cursor: pointer; }
ul.check input { margin-top: .4rem; width: 1rem; height: 1rem; }
p.who { font-size: .9rem; color: var(--ink-2); }
p.note { font-size: .9rem; color: var(--warn); }
.pg { display: inline-grid; gap: .1rem; vertical-align: top; }
.pg a { font-size: .8125rem; font-family: "IBM Plex Mono", ui-monospace, monospace; word-break: break-all; }
pre { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .8rem; line-height: 1.75; color: var(--ink-2); background: var(--sunk); border: 1px solid var(--rule); border-radius: 10px; padding: 1rem 1.15rem; overflow-x: auto; }
pre code { background: none; border: 0; padding: 0; font-size: inherit; white-space: inherit; }
.scroll { overflow-x: auto; }
.scroll table { min-width: 34rem; }
table { width: 100%; border-collapse: collapse; font-size: .9rem; }
th, td { text-align: left; padding: .55rem .85rem; border-top: 1px solid var(--rule); vertical-align: top; color: var(--ink-2); }
th { font-family: "IBM Plex Mono", ui-monospace, monospace; font-weight: 600; font-size: .625rem; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); border-top: 0; border-bottom: 1px solid var(--rule-strong); }
th:first-child, td:first-child { padding-left: 0; }
div.gap { display: grid; gap: .3rem; border: 1px solid var(--crit); border-left-width: 4px; border-radius: 6px; padding: .9rem 1.1rem; color: var(--ink-2); }
div.gap b { color: var(--crit); font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .6875rem; letter-spacing: .14em; text-transform: uppercase; }
div.gap code { white-space: normal; word-break: break-all; }
.progress { display: grid; grid-template-columns: auto auto; justify-content: start; align-items: center; gap: 1rem; font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .8125rem; color: var(--ink-2); }
.progress button { font: inherit; color: var(--ink); background: var(--surface); border: 1px solid var(--rule-strong); border-radius: 6px; padding: .35rem .8rem; cursor: pointer; }
.progress button:hover { border-color: var(--ink); }
.copyable { display: inline-grid; grid-auto-flow: column; gap: .15rem; align-items: center; white-space: nowrap; }
@media (max-width: 40rem) { .copyable { white-space: normal; } }
.copy { display: inline-grid; place-items: center; width: 1.45rem; height: 1.45rem; color: var(--ink-3); background: none; border: 1px solid transparent; border-radius: 4px; cursor: pointer; }
.copy:hover { color: var(--ink); border-color: var(--rule-strong); }
.copy:focus-visible { outline: 2px solid var(--link); outline-offset: 1px; }
.copy.done { color: var(--good); }
.copy svg { width: .95rem; height: .95rem; }
footer { color: var(--ink-3); font-size: .85rem; border-top: 1px solid var(--rule); padding-top: 1.5rem; }
@media print { section.step { break-inside: avoid; } nav.toc { display: none; } .wrap { grid-template-columns: minmax(0, 1fr); } }
</style>
</head>
<body>
<div class="wrap">
${toc()}
<main>
<header>
<h1>${esc(data.title)}</h1>
<p class="sub">${inline(data.sub)}</p>
<div class="progress"><span id="ticked">0 of 0 ticked</span><button type="button" id="clear">Clear every tick</button></div>
</header>

<section class="step" id="start">
<h3><span class="num">0</span>Before you start</h3>
${data.start}
</section>

${data.parts.map(part).join('\n')}

${found()}

<footer>Generated from <code>documents/tests/site-tests.json</code> by <code>node documents/tests/buildSiteTests.mjs</code>. ${stepCount} tests. Ticks are kept in this browser only.</footer>
</main>
</div>
<script>
(function () {
  var STORE = ${JSON.stringify(STORE)};
  var boxes = Array.prototype.slice.call(document.querySelectorAll('input[data-key]'));
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { saved = {}; }
  function count() {
    var done = boxes.filter(function (b) { return b.checked; }).length;
    document.getElementById('ticked').textContent = done + ' of ' + boxes.length + ' ticked';
  }
  function save() {
    var out = {};
    boxes.forEach(function (b) { if (b.checked) out[b.dataset.key] = true; });
    try { localStorage.setItem(STORE, JSON.stringify(out)); } catch (e) {}
    count();
  }
  boxes.forEach(function (b) { b.checked = Boolean(saved[b.dataset.key]); b.addEventListener('change', save); });
  document.getElementById('clear').addEventListener('click', function () {
    if (!confirm('Clear every tick?')) return;
    boxes.forEach(function (b) { b.checked = false; });
    save();
  });
  count();
})();
(function () {
  var EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  var PASSWORDS = ${JSON.stringify(PASSWORD ? [PASSWORD] : [])};
  var COPY = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"/></svg>';
  var DONE = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 8.5l3 3 7-7"/></svg>';
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(area);
      ok ? resolve() : reject();
    });
  }
  document.querySelectorAll('code').forEach(function (code) {
    if (code.closest('pre')) return;
    var text = code.textContent.trim();
    if (!(EMAIL.test(text) || PASSWORDS.indexOf(text) !== -1)) return;
    var wrap = document.createElement('span');
    wrap.className = 'copyable';
    code.parentNode.insertBefore(wrap, code);
    wrap.appendChild(code);
    var button = document.createElement('button');
    button.type = 'button'; button.className = 'copy'; button.title = 'Copy';
    button.setAttribute('aria-label', 'Copy ' + text);
    button.innerHTML = COPY;
    wrap.appendChild(button);
    button.addEventListener('click', function (event) {
      event.preventDefault(); event.stopPropagation();
      copyText(text).then(function () {
        button.classList.add('done'); button.innerHTML = DONE; button.setAttribute('aria-label', 'Copied');
        setTimeout(function () { button.classList.remove('done'); button.innerHTML = COPY; button.setAttribute('aria-label', 'Copy ' + text); }, 1200);
      });
    });
  });
})();
</script>
</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`Wrote ${path.relative(process.cwd(), OUT)}: ${data.parts.length} parts, ${stepCount} tests.`);
