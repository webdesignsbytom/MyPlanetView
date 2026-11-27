// The house rules, enforced at build time (ported from NextDummy's houseRules test).
//
// Colour comes from the tokens in src/styles/index.css: no hex, no rgb()/hsl(),
// no white/black or Tailwind palette classes in components. A colour literal in a
// component ignores light/dark mode and the map styles, so it fails the build.
//
// Layout is grid and gap (no flex, no vertical margins). New code follows it; the
// template code that predates the rule is only counted, as a warning.
//
// Run: node scripts/check-house-rules.mjs   (also runs in `prebuild`)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

// Allowed a literal colour: values for things that render without CSS
// (the theme-color meta tag, the web manifest).
const COLOUR_EXEMPT = new Set([
  'utils/constants/brandColours.js',
  // Dev-only dropdown tuner: <input type="color"> only takes hex.
  'pages/dev/SelectLabPage.jsx',
  // Dev-only home page draft: its globe is drawn on a canvas, which can't read the tokens.
  'utils/homeDraft/globeColours.js',
]);

function sourceFiles(dir = SRC, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const FILES = sourceFiles().map((f) => ({
  rel: path.relative(SRC, f).split(path.sep).join('/'),
  // Comments stripped, so a comment naming a banned pattern doesn't trip it.
  src: fs
    .readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, ''),
}));

function hits(pattern, exempt = new Set()) {
  const found = [];
  for (const { rel, src } of FILES) {
    if (exempt.has(rel)) continue;
    src.split('\n').forEach((line, i) => {
      const m = line.match(pattern);
      if (m) found.push(`${rel}:${i + 1}  ${m[0].trim()}`);
    });
  }
  return found;
}

const UTILITY =
  '(?:bg|text|border|ring|fill|stroke|from|to|via|decoration|outline|divide|placeholder|caret|accent|shadow)';
const PALETTE =
  'slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const COLOUR_RULES = [
  ['hex literal', /(?<![\w&])#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b/],
  ['rgb()/hsl() literal', /\b(?:rgba?|hsla?)\s*\(/],
  ['white/black class', new RegExp(`\\b${UTILITY}-(?:white|black)(?:/\\d{1,3})?\\b`)],
  ['Tailwind palette class', new RegExp(`\\b${UTILITY}-(?:${PALETTE})-\\d{2,3}(?:/\\d{1,3})?\\b`)],
  ['colour in an arbitrary value', /\[[^\]]*(?:#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()[^\]]*\]/],
];

const LAYOUT_RULES = [
  ['flex', /\b(?:inline-)?flex(?:-(?:row|col|wrap|nowrap|1|auto|initial|none))?\b/],
  ['vertical margin', /(?<!scroll-)\b(?:mt|mb|my)-(?:\d|px|auto)/],
];

let failed = 0;
for (const [label, pattern] of COLOUR_RULES) {
  const found = hits(pattern, COLOUR_EXEMPT);
  if (found.length) {
    failed += found.length;
    console.error(`\n✖ ${label} (${found.length}): use a colour token from src/styles/index.css`);
    for (const f of found) console.error(`   ${f}`);
  }
}

let layoutCount = 0;
for (const [, pattern] of LAYOUT_RULES) layoutCount += hits(pattern).length;

if (failed) {
  console.error(`\nHouse rules: ${failed} colour problem(s). Colour comes from tokens only.`);
  process.exit(1);
}
console.log(`✔ House rules: no literal colours in ${FILES.length} files.`);
if (layoutCount) {
  console.warn(`⚠ Layout: ${layoutCount} flex / vertical-margin uses (grid and gap preferred; template code predates the rule).`);
}
