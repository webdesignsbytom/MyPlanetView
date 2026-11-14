// audit-storage.cjs: for every client site, finds each localStorage /
// sessionStorage access in the front-end source and reports the ones not
// inside a try block (within the same function), i.e. the ones that crash
// when a browser blocks storage.
//
// Run from this folder (needs `npm i @babel/parser`), pointing it at the
// folder that holds the sites:
//   node audit-storage.cjs "C:/Users/User/Documents/WorkTop/General Customer"
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const ROOT = process.argv[2];
if (!ROOT) {
  console.log('Usage: node audit-storage.cjs <folder that holds the sites>');
  process.exit(1);
}

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', 'out', '.git', 'old', 'public',
  'scripts', 'tests', 'test', 'e2e', '__tests__', 'coverage', '.vercel', 'playwright-report', 'test-results', 'server', 'backend']);
const EXT = /\.(js|jsx|ts|tsx|mjs)$/;
const FN = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ObjectMethod', 'ClassMethod', 'ClassPrivateMethod']);

function* walkFiles(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue; // skips dot-files and dot-folders
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) yield* walkFiles(p); }
    else if (EXT.test(e.name) && !/\.(spec|test)\./.test(e.name) && !/safeStorage/.test(e.name)) yield p;
  }
}

function isStorageAccess(node) {
  if (node.type !== 'MemberExpression' && node.type !== 'OptionalMemberExpression') return false;
  const o = node.object;
  if (o.type === 'Identifier' && (o.name === 'localStorage' || o.name === 'sessionStorage')) return true;
  // window.localStorage / globalThis.localStorage / self.sessionStorage
  if (o.type === 'Identifier' && ['window', 'globalThis', 'self'].includes(o.name) && !node.computed &&
      ['localStorage', 'sessionStorage'].includes(node.property.name)) return true;
  return false;
}

function audit(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (!/localStorage|sessionStorage/.test(src)) return [];
  let ast;
  try {
    ast = parser.parse(src, { sourceType: 'unambiguous', errorRecovery: true,
      plugins: ['jsx', file.endsWith('.ts') || file.endsWith('.tsx') ? 'typescript' : 'flow', 'decorators-legacy'] });
  } catch (e) { return [{ line: 0, guarded: false, note: `could not parse: ${e.message}` }]; }
  const hits = [];
  const seen = new Set();
  (function visit(node, ancestors) {
    if (!node || typeof node.type !== 'string') return;
    if (isStorageAccess(node)) {
      const key = node.loc.start.line + ':' + node.loc.start.column;
      if (!seen.has(key)) {
        seen.add(key);
        // Protected only by a try block in the same function: a try around a
        // callback's definition doesn't protect the callback when it runs.
        let guarded = false;
        for (let i = ancestors.length - 1; i >= 0; i--) {
          const a = ancestors[i];
          if (FN.has(a.type)) break;
          if (a.type === 'TryStatement' && ancestors[i + 1] === a.block) { guarded = true; break; }
        }
        hits.push({ line: node.loc.start.line, guarded });
      }
      return; // the inner window.localStorage of the same chain is the same access
    }
    for (const k of Object.keys(node)) {
      if (k === 'loc' || k === 'start' || k === 'end' || k === 'leadingComments' || k === 'trailingComments') continue;
      const v = node[k];
      if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === 'string' && visit(c, [...ancestors, node]));
      else if (v && typeof v.type === 'string') visit(v, [...ancestors, node]);
    }
  })(ast.program, []);
  return hits;
}

const results = [];
for (const site of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!site.isDirectory() || site.name.startsWith('_') || site.name.startsWith('.')) continue;
  const siteDir = path.join(ROOT, site.name);
  let unguarded = 0, guarded = 0, parseErrors = 0;
  const files = new Map();
  for (const f of walkFiles(siteDir)) {
    for (const h of audit(f)) {
      if (h.note) { parseErrors++; continue; }
      if (h.guarded) guarded++;
      else {
        unguarded++;
        const rel = path.relative(siteDir, f).replace(/\\/g, '/');
        files.set(rel, [...(files.get(rel) || []), h.line]);
      }
    }
  }
  if (unguarded + guarded + parseErrors === 0) continue;
  results.push({ site: site.name, unguarded, guarded, parseErrors, files });
}

results.sort((a, b) => b.unguarded - a.unguarded || a.site.localeCompare(b.site));
const needFix = results.filter((r) => r.unguarded);
console.log(`NEEDS FIX (${needFix.length} sites with unprotected storage calls):`);
for (const r of needFix) {
  console.log(`  ${r.site.padEnd(22)} ${String(r.unguarded).padStart(3)} unprotected, ${r.guarded} protected${r.parseErrors ? `, ${r.parseErrors} unparsed file(s)` : ''}`);
  for (const [f, lines] of r.files) console.log(`      ${f}: ${lines.join(', ')}`);
}
const safe = results.filter((r) => !r.unguarded);
console.log(`\nALREADY SAFE (${safe.length} sites, every storage call protected):`);
for (const r of safe) {
  console.log(`  ${r.site.padEnd(22)} ${r.guarded} protected${r.parseErrors ? `, ${r.parseErrors} unparsed file(s)` : ''}`);
}
