import React, { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import ErrorBoundary from '@/utils/error/ErrorBoundary';
import { CountryListPanel, CountryPanel, StatsPanel, TimelinePanel, TripsPanel, preloadTool, preloadWhenIdle } from '@/components/map/lazyMapPanels';

// The stats panel's code fails to download while `offline` (each try asks again), then arrives
const { network } = vi.hoisted(() => ({ network: { offline: false, tries: 0 } }));
vi.mock('@/components/map/StatsPanel', () => {
  network.tries += 1;
  if (network.offline) throw new Error('Failed to fetch dynamically imported module');
  return { default: ({ title }) => <p data-stats-panel>{title}</p> };
});
vi.mock('@/components/map/TimelinePanel', () => ({ default: () => <p data-timeline-panel>Timeline</p> }));

const show = (Panel, props = {}) =>
  render(
    <ErrorBoundary fallback={<p data-failed>Not opened</p>}>
      <Suspense fallback={<p data-loading>Loading</p>}>
        <Panel {...props} />
      </Suspense>
    </ErrorBoundary>,
  );

describe('lazyMapPanels', () => {
  it('renders a panel once its code is in, at once the next time', async () => {
    const first = show(TimelinePanel);
    expect(await first.findByText('Timeline')).toBeTruthy();
    first.unmount();
    const second = show(TimelinePanel);
    // Loaded already: no fallback flash
    expect(second.container.querySelector('[data-loading]')).toBeNull();
    expect(second.container.querySelector('[data-timeline-panel]')).not.toBeNull();
  });

  it('gives a panel whose download failed a fresh try on the next open', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    network.offline = true;
    const failed = show(StatsPanel, { title: 'Travel statistics' });
    expect(await failed.findByText('Not opened')).toBeTruthy();
    failed.unmount();
    const triesOffline = network.tries;
    // Back online: not stuck on the failure until a reload, the next open downloads it again
    network.offline = false;
    const again = show(StatsPanel, { title: 'Travel statistics' });
    expect(await again.findByText('Travel statistics')).toBeTruthy();
    expect(network.tries).toBeGreaterThan(triesOffline);
  });

  it('shares one download between preload and the open', async () => {
    const a = TimelinePanel.preload();
    const b = TimelinePanel.preload();
    expect(a).toBe(b);
    expect((await a).default).toBeTypeOf('function');
  });

  it('fetches what a tool opens: the country list warms up a country too', () => {
    const list = vi.spyOn(CountryListPanel, 'preload').mockResolvedValue({});
    const country = vi.spyOn(CountryPanel, 'preload').mockResolvedValue({});
    const trips = vi.spyOn(TripsPanel, 'preload').mockResolvedValue({});
    preloadTool('countries');
    expect(list).toHaveBeenCalled();
    expect(country).toHaveBeenCalled();
    expect(trips).not.toHaveBeenCalled();
    // An unknown tool fetches nothing, and a failure is left for the real open
    expect(() => preloadTool('nothing')).not.toThrow();
    trips.mockRejectedValue(new Error('offline'));
    expect(() => preloadTool('trips')).not.toThrow();
  });

  it('fetches the tools’ panels one per idle moment, in order, until stopped', () => {
    const queue = [];
    vi.stubGlobal('requestIdleCallback', (fn) => queue.push(fn));
    const cancel = vi.fn();
    vi.stubGlobal('cancelIdleCallback', cancel);
    const list = vi.spyOn(CountryListPanel, 'preload').mockResolvedValue({});
    const trips = vi.spyOn(TripsPanel, 'preload').mockResolvedValue({});
    const stop = preloadWhenIdle(['countries', 'trips']);
    expect(list).not.toHaveBeenCalled();
    queue.shift()();
    expect(list).toHaveBeenCalled();
    expect(trips).not.toHaveBeenCalled();
    queue.shift()();
    expect(trips).toHaveBeenCalled();
    stop();
    expect(cancel).toHaveBeenCalled();
  });

  it('waits on a timer where there is no idle callback', () => {
    vi.stubGlobal('requestIdleCallback', undefined);
    vi.useFakeTimers();
    try {
      const list = vi.spyOn(CountryListPanel, 'preload').mockResolvedValue({});
      preloadWhenIdle(['countries']);
      vi.advanceTimersByTime(1499);
      expect(list).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(list).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
