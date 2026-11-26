import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const initialize = vi.fn(() => {
  window.gtag = vi.fn();
});
vi.mock('react-ga4', () => ({ default: { initialize: (...args) => initialize(...args) } }));
vi.mock('@/utils/seo/vitals.js', () => ({}));

const ID = 'G-TEST123';
const DISABLE = `ga-disable-${ID}`;
const origin = window.location.origin;
const original = { pushState: window.history.pushState, replaceState: window.history.replaceState };

// Each test gets a fresh copy of the module (it keeps its state in module variables)
async function freshGA() {
  vi.resetModules();
  return import('@/utils/analytics/initGA');
}
const go = (path) => original.pushState.call(window.history, {}, '', path);
const gtagCalls = () => window.gtag.mock.calls;

describe('initGA', () => {
  beforeEach(() => {
    initialize.mockClear();
    go('/');
  });

  afterEach(() => {
    // The module hooks history: put it back, so no older copy of the module hears later tests
    window.history.pushState = original.pushState;
    window.history.replaceState = original.replaceState;
    delete window[DISABLE];
    delete window.gtag;
  });

  it('does nothing without a measurement id', async () => {
    const { initGA, analyticsActive } = await freshGA();
    initGA('');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(initialize).not.toHaveBeenCalled();
    expect(analyticsActive()).toBe(false);
  });

  it('loads GA when idle, without its own page views, with only the redacted address and a route as the title', async () => {
    go('/maps/abc-123?token=secret#x');
    const { initGA, analyticsActive } = await freshGA();
    initGA(ID);
    await vi.waitFor(() => expect(initialize).toHaveBeenCalled());

    expect(initialize).toHaveBeenCalledWith(ID, { gaOptions: {}, gtagOptions: { send_page_view: false } });
    expect(gtagCalls()).toContainEqual(['set', { page_location: `${origin}/maps/:mapId`, page_referrer: '', page_title: '/maps/:mapId' }]);
    expect(gtagCalls()).toContainEqual(['consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', wait_for_update: 500 }]);
    expect(analyticsActive()).toBe(true);
    expect(window[DISABLE]).toBeUndefined();
  });

  it('queues a page view until GA is ready, then sends it', async () => {
    go('/about?utm_source=news&email=a@b.c');
    const { initGA, sendPageView } = await freshGA();
    initGA(ID);
    sendPageView();
    await vi.waitFor(() => expect(window.gtag).toBeTypeOf('function'));
    await vi.waitFor(() =>
      expect(gtagCalls()).toContainEqual([
        'event',
        'page_view',
        { page_location: `${origin}/about?utm_source=news`, page_referrer: '', page_title: '/about' },
      ]),
    );
  });

  it('pauses GA on a page with a secret and resumes it after, with the secret page as a pattern in the referrer', async () => {
    const { initGA, sendPageView, analyticsActive } = await freshGA();
    initGA(ID);
    await vi.waitFor(() => expect(initialize).toHaveBeenCalled());

    // History is hooked: a route change tracks the address by itself
    window.history.pushState({}, '', '/shared/K7QX-M2PA-9RTW');
    expect(window[DISABLE]).toBe(true);
    expect(analyticsActive()).toBe(false);
    window.gtag.mockClear();
    sendPageView();
    expect(gtagCalls().filter(([kind]) => kind === 'event')).toEqual([]);

    window.history.replaceState({}, '', '/pricing');
    expect(window[DISABLE]).toBeUndefined();
    expect(gtagCalls()).toContainEqual(['set', { page_location: `${origin}/pricing`, page_referrer: `${origin}/shared/:code`, page_title: '/pricing' }]);
    sendPageView();
    expect(gtagCalls()).toContainEqual(['event', 'page_view', expect.objectContaining({ page_location: `${origin}/pricing` })]);
  });

  it('never sets the same address twice in a row', async () => {
    const { initGA, trackAddress } = await freshGA();
    initGA(ID);
    await vi.waitFor(() => expect(initialize).toHaveBeenCalled());
    window.gtag.mockClear();
    trackAddress();
    expect(window.gtag).not.toHaveBeenCalled();
  });
});

describe('stopGA', () => {
  beforeEach(() => {
    initialize.mockClear();
    go('/');
  });

  afterEach(() => {
    window.history.pushState = original.pushState;
    window.history.replaceState = original.replaceState;
    delete window[DISABLE];
    delete window.gtag;
  });

  it('stops GA for good: paused everywhere, consent denied, queued views dropped and its cookies deleted', async () => {
    const { initGA, stopGA, sendPageView, analyticsActive } = await freshGA();
    initGA(ID);
    await vi.waitFor(() => expect(initialize).toHaveBeenCalled());
    document.cookie = '_ga=GA1.1.123; path=/';
    document.cookie = '_ga_ABC=GS1.1; path=/';
    document.cookie = '_gid=GA1.2; path=/';
    document.cookie = 'theme=dark; path=/';
    window.gtag.mockClear();

    stopGA(ID);

    expect(window[DISABLE]).toBe(true);
    expect(gtagCalls()).toContainEqual(['consent', 'update', { analytics_storage: 'denied' }]);
    expect(document.cookie).not.toMatch(/_ga|_gid/);
    expect(document.cookie).toContain('theme=dark');
    expect(analyticsActive()).toBe(false);

    // Not even on a page with nothing secret
    window.history.pushState({}, '', '/about');
    expect(window[DISABLE]).toBe(true);
    window.gtag.mockClear();
    sendPageView();
    expect(window.gtag).not.toHaveBeenCalled();
    document.cookie = 'theme=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('withdrawn while GA’s code is on its way: GA never starts', async () => {
    const { initGA, stopGA, analyticsActive } = await freshGA();
    initGA(ID);
    stopGA(ID);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(initialize).not.toHaveBeenCalled();
    expect(analyticsActive()).toBe(false);
  });

  it('a yes again in the same visit resumes the GA already loaded', async () => {
    const { initGA, stopGA, analyticsActive } = await freshGA();
    initGA(ID);
    await vi.waitFor(() => expect(initialize).toHaveBeenCalled());
    stopGA(ID);
    window.gtag.mockClear();

    initGA(ID);

    expect(initialize).toHaveBeenCalledTimes(1);
    expect(gtagCalls()).toContainEqual(['consent', 'update', { analytics_storage: 'granted' }]);
    expect(window[DISABLE]).toBeUndefined();
    expect(analyticsActive()).toBe(true);
  });

  it('works before GA was ever loaded, deleting cookies a past visit left', async () => {
    document.cookie = '_gat_UA1=1; path=/';
    const { stopGA } = await freshGA();
    stopGA(ID);
    expect(window[DISABLE]).toBe(true);
    expect(document.cookie).not.toContain('_gat');
  });

  // Events (utils/analytics/events.js; the audit, 26 Nov 2026)
  it('sends an event only once consent is given, with plain values only', async () => {
    const { initGA, trackEvent } = await freshGA();
    // No consent yet: nothing kept for later
    trackEvent('sign_up', { method: 'email' });
    initGA(ID);
    // Queued while GA loads, then sent
    trackEvent('upload_photos', { count: 3, who: { id: 'u1' }, note: 'x'.repeat(41), ok: true, bad: NaN });
    await vi.waitFor(() => expect(gtagCalls()).toContainEqual(['event', 'upload_photos', { count: 3, ok: true }]));
    expect(gtagCalls().some(([, name]) => name === 'sign_up')).toBe(false);
    trackEvent('share', { method: 'link', content_type: 'map' });
    expect(gtagCalls()).toContainEqual(['event', 'share', { method: 'link', content_type: 'map' }]);
  });

  it('sends no event on a secret page, or once consent is withdrawn', async () => {
    const { initGA, stopGA, trackEvent } = await freshGA();
    initGA(ID);
    await vi.waitFor(() => expect(initialize).toHaveBeenCalled());
    go('/shared/ABCD-EFGH-JKMN');
    trackEvent('share', { method: 'link' });
    go('/map');
    stopGA(ID);
    trackEvent('mark_country', { status: 'visited' });
    expect(gtagCalls().filter(([kind]) => kind === 'event')).toEqual([]);
  });
});
