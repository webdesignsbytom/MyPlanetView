// Ad and tracker blockers' network rules (Adblock Plus syntax: EasyList, EasyPrivacy, uBlock
// Origin's and AdGuard's lists), read well enough to say whether a blocker would block one of
// the site's own requests. 27 Nov 2026, the user's wish ("the site should always load even with
// adblockers"): an ad blocker blocked /src/utils/analytics/events.js on the dev server, where
// every file is fetched at its own path, and the whole site stayed blank.
//
// Only what can block a first-party request is kept: never cosmetic rules, exceptions (@@, so a
// rule counts even if another list would let it through), rules for other sites (`$third-party`,
// `$domain=` listing sites, `||host^` for a host we don't use) or rules that don't block
// (`$removeparam`, `$csp`, ...). Matching is by the rule's longest literal word first, so a
// million rules test thousands of addresses in seconds.

const TYPE_ALIASES = { xhr: 'xmlhttprequest', css: 'stylesheet', frame: 'subdocument', '1p': 'first-party', '3p': 'third-party', doc: 'document', fetch: 'xmlhttprequest' };
const TYPES = new Set(['script', 'image', 'stylesheet', 'xmlhttprequest', 'font', 'media', 'subdocument', 'object', 'other', 'ping', 'websocket', 'document', 'popup']);
// Options that change a request (or a page) rather than blocking it
const NON_BLOCKING = new Set([
  'removeparam', 'queryprune', 'csp', 'redirect-rule', 'header', 'replace', 'permissions', 'cookie', 'jsonprune', 'urltransform', 'urlskip',
  'stealth', 'hls', 'xmlprune', 'elemhide', 'ehide', 'generichide', 'ghide', 'specifichide', 'shide', 'content', 'jsinject', 'extension',
  'genericblock', 'badfilter', 'denyallow', 'to', 'method', 'app', 'network', 'referrerpolicy', 'inline-script', 'inline-font', 'urlblock',
]);

const isRegexRule = (pattern) => pattern.length > 2 && pattern.startsWith('/') && pattern.endsWith('/');
const escapeRe = (s) => s.replace(/[.+?${}()|[\]\\/]/g, '\\$&');

/** A rule's pattern as a regular expression, or null where it isn't one JavaScript can read. */
export function compilePattern(pattern, matchCase = false) {
  const flags = matchCase ? '' : 'i';
  if (isRegexRule(pattern)) {
    try {
      return new RegExp(pattern.slice(1, -1), flags);
    } catch {
      return null;
    }
  }
  let p = pattern;
  let prefix = '';
  let suffix = '';
  if (p.startsWith('||')) {
    prefix = '^[a-z][a-z0-9+.-]*:\\/\\/(?:[^\\/?#]*\\.)?';
    p = p.slice(2);
  } else if (p.startsWith('|')) {
    prefix = '^';
    p = p.slice(1);
  }
  if (p.endsWith('|')) {
    suffix = '$';
    p = p.slice(0, -1);
  }
  const body = [...p].map((ch) => (ch === '*' ? '.*' : ch === '^' ? '(?:[^a-zA-Z0-9_.%-]|$)' : escapeRe(ch))).join('');
  try {
    return new RegExp(prefix + body + suffix, flags);
  } catch {
    return null;
  }
}

/**
 * One line of a filter list as a rule that could block one of our own requests, or null.
 * `ourHosts`: the hosts the site's requests go to (a `||host^` rule for any other is dropped).
 */
export function parseRule(line, { list = '', ourHosts = [] } = {}) {
  const text = line.trim();
  if (!text || text.startsWith('!') || text.startsWith('[') || text.startsWith('@@')) return null;
  if (/#[@?$%]?#|#\+js|\$\$|#@\$#|#@%#/.test(text)) return null;
  let pattern = text;
  let options = [];
  const dollar = text.lastIndexOf('$');
  if (dollar > 0 && !isRegexRule(text)) {
    const opts = text.slice(dollar + 1);
    if (/^[\w~,=.|*\-:/ ]*$/.test(opts) || opts.includes('domain=')) {
      pattern = text.slice(0, dollar);
      options = opts.split(',').map((o) => o.trim()).filter(Boolean);
    }
  }
  if (!pattern || pattern === '*' || pattern === '|' || pattern === '||') return null;
  const rule = { list, raw: text, pattern, types: new Set(), notTypes: new Set(), matchCase: false, host: null, token: null };
  for (const option of options) {
    const negated = option.startsWith('~');
    const [rawName, value = ''] = (negated ? option.slice(1) : option).split('=');
    const name = TYPE_ALIASES[rawName] || rawName;
    if (name === 'third-party') {
      if (!negated) return null;
    } else if (name === 'first-party') {
      if (negated) return null;
    } else if (name === 'domain' || name === 'from') {
      // Only on the sites listed: never ours (a list of only ~exceptions applies everywhere else)
      if (value.split('|').some((d) => d && !d.startsWith('~'))) return null;
    } else if (name === 'ipaddress') {
      // Only for a site at that address (a scam host's): never ours
      return null;
    } else if (name === 'match-case') {
      rule.matchCase = true;
    } else if (NON_BLOCKING.has(name)) {
      return null;
    } else if (TYPES.has(name)) {
      (negated ? rule.notTypes : rule.types).add(name);
    }
    // important, all, redirect=..., strict1p and the like still block
  }
  if (pattern.startsWith('||')) {
    rule.host = pattern.slice(2).split(/[/^*:?|]/)[0].toLowerCase();
    const ours = ourHosts.some((h) => h === rule.host || h.endsWith(`.${rule.host}`));
    if (!ours) return null;
  }
  if (!isRegexRule(pattern)) {
    rule.token = pattern.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3).sort((a, b) => b.length - a.length)[0] || null;
  }
  return rule;
}

/** Every rule in a list's text that could block one of our requests. */
export function parseList(text, options = {}) {
  const rules = [];
  for (const line of text.split(/\r?\n/)) {
    const rule = parseRule(line, options);
    if (rule) rules.push(rule);
  }
  return rules;
}

/**
 * A matcher over `rules`: `blockedBy(url, type)` -> the first rule that blocks a request of
 * `type` (script, stylesheet, image, font, xmlhttprequest, document, other) to `url`, or null.
 */
export function makeMatcher(rules) {
  const byToken = new Map();
  const untokened = [];
  for (const rule of rules) {
    if (!rule.token) untokened.push(rule);
    else if (byToken.has(rule.token)) byToken.get(rule.token).push(rule);
    else byToken.set(rule.token, [rule]);
  }
  // The rules whose word is somewhere in the address: any part of any run of letters and digits
  const candidates = (lower) => {
    const found = new Set(untokened);
    for (const run of lower.split(/[^a-z0-9]+/)) {
      for (let i = 0; i < run.length; i++) {
        for (let j = i + 3; j <= run.length; j++) {
          const list = byToken.get(run.slice(i, j));
          if (list) list.forEach((rule) => found.add(rule));
        }
      }
    }
    return found;
  };
  return {
    size: rules.length,
    blockedBy(url, type = 'script') {
      const lower = url.toLowerCase();
      for (const rule of candidates(lower)) {
        if (rule.types.size && !rule.types.has(type)) continue;
        if (rule.notTypes.has(type)) continue;
        if (rule.re === undefined) rule.re = compilePattern(rule.pattern, rule.matchCase);
        if (rule.re && rule.re.test(url)) return rule;
      }
      return null;
    },
  };
}

/** A request's type for a blocker, from the file it asks for. */
export function requestTypeOf(url) {
  const path = url.split(/[?#]/)[0].toLowerCase();
  if (/\.(m?js|jsx|ts|tsx|json)$/.test(path)) return 'script';
  if (/\.css$/.test(path)) return 'stylesheet';
  if (/\.(woff2?|ttf|otf|eot)$/.test(path)) return 'font';
  if (/\.(webp|avif|jpe?g|png|gif|svg|ico)$/.test(path)) return 'image';
  if (/\.(mp4|webm|m3u8)$/.test(path)) return 'media';
  if (/\.html?$/.test(path)) return 'document';
  return 'other';
}
