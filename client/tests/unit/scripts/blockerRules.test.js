// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compilePattern, makeMatcher, parseList, parseRule, requestTypeOf } from '../../../scripts/lib/blockerRules.mjs';

// Ad and tracker blockers' rules, read to say whether one would block the site's own requests
// (27 Nov 2026, the user's wish: an ad blocker blocked /src/utils/analytics/events.js and the
// dev site stayed blank; scripts/check-blocker-names.mjs)

const OURS = ['localhost', 'myplanetview.com'];
const matcherOf = (text) => makeMatcher(parseList(text, { list: 'test', ourHosts: OURS }));
const DEV = 'http://localhost:5173';

describe('the blockers’ rules', () => {
  it('blocks today’s culprit and not its new name (EasyPrivacy’s own rule)', () => {
    const matcher = matcherOf('/analytics/event$domain=~app.diagrams.net');
    expect(matcher.blockedBy(`${DEV}/src/utils/analytics/events.js`, 'script')?.raw).toBe('/analytics/event$domain=~app.diagrams.net');
    expect(matcher.blockedBy(`${DEV}/src/utils/analytics/siteActions.js`, 'script')).toBeNull();
  });

  it('matches wildcards, the separator ^ and the | anchors, any case unless match-case', () => {
    const matcher = matcherOf(['/cookieconsent*.js', '/tracker^', '|https://myplanetview.com/beacon', 'pixel.gif|', '/Exact$match-case'].join('\n'));
    expect(matcher.blockedBy(`${DEV}/assets/CookieConsent.min.js`)).not.toBeNull();
    expect(matcher.blockedBy(`${DEV}/tracker?x=1`)).not.toBeNull();
    expect(matcher.blockedBy(`${DEV}/trackers/a.js`)).toBeNull();
    expect(matcher.blockedBy('https://myplanetview.com/beacon/1')).not.toBeNull();
    expect(matcher.blockedBy(`${DEV}/x/beacon`)).toBeNull();
    expect(matcher.blockedBy(`${DEV}/a/pixel.gif`, 'image')).not.toBeNull();
    expect(matcher.blockedBy(`${DEV}/a/pixel.gif?v=1`, 'image')).toBeNull();
    expect(matcher.blockedBy(`${DEV}/Exact`)).not.toBeNull();
    expect(matcher.blockedBy(`${DEV}/exact`)).toBeNull();
  });

  it('reads a regular-expression rule', () => {
    const matcher = matcherOf('/\\/ga[0-9]?\\.js$/');
    expect(matcher.blockedBy(`${DEV}/js/ga4.js`)).not.toBeNull();
    expect(matcher.blockedBy(`${DEV}/js/garden.js`)).toBeNull();
  });

  it('applies a type to its requests only', () => {
    const matcher = matcherOf(['/banner-art.$image', '/widget.$~script'].join('\n'));
    expect(matcher.blockedBy(`${DEV}/banner-art.webp`, 'image')).not.toBeNull();
    expect(matcher.blockedBy(`${DEV}/banner-art.js`, 'script')).toBeNull();
    expect(matcher.blockedBy(`${DEV}/widget.css`, 'stylesheet')).not.toBeNull();
    expect(matcher.blockedBy(`${DEV}/widget.js`, 'script')).toBeNull();
  });

  it('keeps only rules that could block our own requests', () => {
    const keep = (line) => parseRule(line, { ourHosts: OURS });
    // Other sites' requests, or on other sites only
    expect(keep('/stats.js$third-party')).toBeNull();
    expect(keep('/stats.js$3p')).toBeNull();
    expect(keep('/stats.js$domain=example.org')).toBeNull();
    expect(keep('/stats.js$domain=~example.org')).not.toBeNull();
    expect(keep('||tracker.example^')).toBeNull();
    expect(keep('||myplanetview.com/go/')).not.toBeNull();
    expect(keep('||com^$doc,ipaddress=206.82.7.123')).toBeNull();
    // Not blocking rules, exceptions, cosmetic rules, comments
    expect(keep('/stats.js$removeparam=utm')).toBeNull();
    expect(keep('/stats.js$csp=script-src none')).toBeNull();
    expect(keep('@@/stats.js')).toBeNull();
    expect(keep('example.org##.ad')).toBeNull();
    expect(keep('##.cookie-banner')).toBeNull();
    expect(keep('! a comment')).toBeNull();
    expect(keep('[Adblock Plus 2.0]')).toBeNull();
    // Still blocking
    expect(keep('/stats.js$important,script')).not.toBeNull();
    expect(keep('/stats.js$1p')).not.toBeNull();
  });

  it('files rules by their longest word, so a long list matches fast', () => {
    expect(parseRule('/bundle-analytics.js').token).toBe('analytics');
    expect(parseRule('/a.b').token).toBeNull();
    // A rule with no word long enough is tried on every address
    expect(matcherOf('/ga.').blockedBy(`${DEV}/x/ga.js`)).not.toBeNull();
    // A word inside a longer one still finds its rule
    expect(matcherOf('analytics.js').blockedBy(`${DEV}/x/adobeanalytics.js`)).not.toBeNull();
  });

  it('turns a rule that isn’t a valid expression into nothing', () => {
    expect(compilePattern('/(unclosed/')).toBeNull();
    expect(compilePattern('/plain*path^').test('/plain/x/path?')).toBe(true);
  });

  it('knows a request’s type from its file', () => {
    expect(requestTypeOf(`${DEV}/src/App.jsx`)).toBe('script');
    expect(requestTypeOf(`${DEV}/node_modules/.vite/deps/react.js?v=1`)).toBe('script');
    expect(requestTypeOf('https://x/assets/s-abc.css')).toBe('stylesheet');
    expect(requestTypeOf('https://x/a/Poppins-400.woff2')).toBe('font');
    expect(requestTypeOf('https://x/m/fr-800.webp')).toBe('image');
    expect(requestTypeOf('https://x/pricing.html')).toBe('document');
    expect(requestTypeOf('https://x/api/maps')).toBe('other');
  });
});
