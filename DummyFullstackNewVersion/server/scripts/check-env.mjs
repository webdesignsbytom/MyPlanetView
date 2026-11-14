#!/usr/bin/env node
// Compare env file key names against .env.example
// Usage: node scripts/check-env.mjs [--example <file>] [--targets a,b] [--strict]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Server root
const ROOT = path.resolve(__dirname, '..');

// Arg parser
function parseArgs(argv) {
  const args = { example: '.env.example', targets: null, strict: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--strict') args.strict = true;
    else if (a === '--example') args.example = argv[++i];
    else if (a === '--targets') args.targets = argv[++i];
    else if (a.startsWith('--example=')) args.example = a.slice('--example='.length);
    else if (a.startsWith('--targets=')) args.targets = a.slice('--targets='.length);
  }
  return args;
}

const argv = parseArgs(process.argv.slice(2));

// Files to check
const DEFAULT_TARGETS = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.test',
  '.env.production',
];
const TARGET_FILES = argv.targets
  ? argv.targets.split(',').map((s) => s.trim()).filter(Boolean)
  : DEFAULT_TARGETS;

// Colours
const useColour = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (useColour ? `\x1b[${code}m${s}\x1b[0m` : s);
const red = (s) => c('31', s);
const green = (s) => c('32', s);
const yellow = (s) => c('33', s);
const dim = (s) => c('2', s);
const bold = (s) => c('1', s);

// Parse env key names (never values)
const KEY_RE = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/;

function parseEnvKeys(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const keys = new Set();
  const empty = new Set();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue; // blank / comment

    const m = line.match(KEY_RE);
    if (!m) continue;

    const key = m[1];
    // Strip quotes for empty check
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    keys.add(key);
    if (value === '') empty.add(key);
  }

  return { keys, empty };
}

// Run
const examplePath = path.resolve(ROOT, argv.example);

if (!fs.existsSync(examplePath)) {
  console.error(red(`✖ Example file not found: ${path.relative(ROOT, examplePath)}`));
  console.error(dim('  Pass one with --example <file> if it lives elsewhere.'));
  process.exit(2);
}

const { keys: expectedKeys } = parseEnvKeys(examplePath);
const expected = [...expectedKeys];

console.log(bold(`\nEnv check`) + dim(`  (root: ${ROOT})`));
console.log(dim(`Reference: ${argv.example} — ${expected.length} expected keys\n`));

let hadMissing = false;
let checkedAny = false;

for (const file of TARGET_FILES) {
  const target = path.resolve(ROOT, file);

  if (!fs.existsSync(target)) {
    console.log(`${dim('•')} ${bold(file.padEnd(20))} ${dim('not found — skipped')}`);
    continue;
  }

  checkedAny = true;
  const { keys, empty } = parseEnvKeys(target);

  const missing = expected.filter((k) => !keys.has(k));
  const emptyRequired = expected.filter((k) => keys.has(k) && empty.has(k));
  const extra = [...keys].filter((k) => !expectedKeys.has(k));

  const failsStrict = missing.length > 0 || (argv.strict && emptyRequired.length > 0);
  if (missing.length > 0) hadMissing = true;

  const status = failsStrict ? red('FAIL') : green('OK');
  console.log(`\n${bold(file)}  ${status}`);

  if (missing.length) {
    console.log(red(`  ✖ missing ${missing.length}:`));
    for (const k of missing) console.log(red(`      - ${k}`));
  }

  if (emptyRequired.length) {
    const tag = argv.strict ? red('✖') : yellow('!');
    console.log(
      `  ${tag} present but empty ${emptyRequired.length}${argv.strict ? '' : dim(' (warning)')}:`,
    );
    for (const k of emptyRequired) {
      console.log(argv.strict ? red(`      - ${k}`) : yellow(`      - ${k}`));
    }
  }

  if (extra.length) {
    console.log(dim(`  · extra ${extra.length} not in example (fyi): ${extra.join(', ')}`));
  }

  if (!missing.length && !emptyRequired.length && !extra.length) {
    console.log(green('  ✔ all expected keys present'));
  }
}

console.log('');

if (!checkedAny) {
  console.log(yellow('No target env files found. Create one (e.g. copy .env.example to .env).'));
  console.log(dim(`Looked for: ${TARGET_FILES.join(', ')}`));
  process.exit(0);
}

if (hadMissing) {
  console.log(red(bold('✖ Some env files are missing required keys (see above).')));
  process.exit(1);
}

console.log(green(bold('✔ All checked env files contain every key from .env.example.')));
process.exit(0);
