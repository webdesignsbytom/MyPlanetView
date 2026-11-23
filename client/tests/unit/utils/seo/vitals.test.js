import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const reporters = {};
vi.mock('web-vitals', () => ({
  onLCP: (fn) => (reporters.LCP = fn),
  onCLS: (fn) => (reporters.CLS = fn),
  onINP: (fn) => (reporters.INP = fn),
  onTTFB: (fn) => (reporters.TTFB = fn),
}));
vi.mock('@/utils/analytics/initGA', () => ({ analyticsActive: vi.fn() }));

import { analyticsActive } from '@/utils/analytics/initGA';

beforeAll(async () => {
  await import('@/utils/seo/vitals');
});

let gtag;
beforeEach(() => {
  gtag = vi.fn();
  window.gtag = gtag;
  analyticsActive.mockReturnValue(true);
});

describe('vitals', () => {
  it('listens for the four web vitals as it loads', () => {
    expect(Object.keys(reporters).sort()).toEqual(['CLS', 'INP', 'LCP', 'TTFB']);
  });

  it('reports each as a GA event, rounded, with CLS in thousandths', () => {
    reporters.LCP({ name: 'LCP', value: 1234.6, id: 'v1' });
    reporters.CLS({ name: 'CLS', value: 0.0456, id: 'v2' });
    expect(gtag).toHaveBeenNthCalledWith(1, 'event', 'web_vital', {
      event_category: 'Web Vitals',
      event_label: 'LCP',
      value: 1235,
      metric_id: 'v1',
      metric_value: 1234.6,
    });
    expect(gtag.mock.calls[1][2]).toMatchObject({ event_label: 'CLS', value: 46, metric_value: 0.0456 });
  });

  it('reports nothing once consent is withdrawn, or before GA is there', () => {
    analyticsActive.mockReturnValue(false);
    reporters.INP({ name: 'INP', value: 80, id: 'v3' });
    expect(gtag).not.toHaveBeenCalled();
    analyticsActive.mockReturnValue(true);
    delete window.gtag;
    expect(() => reporters.TTFB({ name: 'TTFB', value: 300, id: 'v4' })).not.toThrow();
  });
});
