import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import CompareResults from '@/components/compare/CompareResults';
import { drawCompareMap } from '@/utils/compare/drawCompareMap';

vi.mock('@/utils/compare/drawCompareMap', () => ({ drawCompareMap: vi.fn() }));

const visit = (countryCode, status = 'VISITED') => ({ countryCode, status });
const A = { label: 'Our map', visits: [visit('FR'), visit('JP'), visit('PE', 'WANT_TO_GO')] };
const B = { label: 'Jo’s map', visits: [visit('FR'), visit('BR'), visit('AU'), visit('PE', 'WANT_TO_GO')] };

beforeEach(() => {
  vi.clearAllMocks();
  drawCompareMap.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  URL.createObjectURL = vi.fn(() => 'blob:compare');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  delete URL.createObjectURL;
  delete URL.revokeObjectURL;
});

const group = (container, id) => container.querySelector(`[data-compare-group="${id}"]`);

describe('CompareResults', () => {
  it('sums it up, then lists both, only each and both want to go, by name', () => {
    const { container } = render(<CompareResults a={A} b={B} />);
    expect(container.querySelector('[data-compare-summary]').textContent).toBe(
      'Both have been to 1 country. Our map has 1 country the other doesn’t, and Jo’s map 2 countries.',
    );
    expect(group(container, 'compare-both').querySelector('h3').textContent).toBe('Both: 1 country');
    expect(group(container, 'compare-both').querySelector('[data-compare-names]').textContent).toBe('France');
    expect(group(container, 'compare-only-a').querySelector('h3').textContent).toBe('Only Our map: 1 country');
    expect(group(container, 'compare-only-a').querySelector('[data-compare-names]').textContent).toBe('Japan');
    expect(group(container, 'compare-only-b').querySelector('[data-compare-names]').textContent).toBe('Australia · Brazil');
    expect(group(container, 'compare-want').querySelector('[data-compare-names]').textContent).toBe('Peru');
    // Each map's group has its colour's swatch; "want to go" has none
    expect(group(container, 'compare-both').querySelector('h3 [aria-hidden="true"]')).toBeTruthy();
    expect(group(container, 'compare-want').querySelector('h3 [aria-hidden="true"]')).toBeNull();
  });

  it('draws the world with the three groups, described in words', async () => {
    const { container } = render(<CompareResults a={A} b={B} />);
    await waitFor(() => expect(container.querySelector('[data-compare-picture]')).toBeTruthy());
    expect(drawCompareMap).toHaveBeenCalledWith({ both: ['FR'], onlyA: ['JP'], onlyB: ['AU', 'BR'], bothWant: ['PE'] });
    const img = container.querySelector('[data-compare-picture]');
    expect(img.getAttribute('src')).toBe('blob:compare');
    expect(img.getAttribute('alt')).toBe('The world: 1 country on both maps, 1 country only on Our map, 2 countries only on Jo’s map.');
  });

  it('says so when a group is empty, and leaves the picture out if it can’t be drawn', async () => {
    drawCompareMap.mockRejectedValue(new Error('no canvas'));
    const { container } = render(<CompareResults a={{ label: 'Ours', visits: [visit('FR')] }} b={{ label: 'Theirs', visits: [] }} />);
    expect(group(container, 'compare-both').querySelector('[data-compare-names]').textContent).toBe('None yet: somewhere to go together?');
    expect(group(container, 'compare-only-b').querySelector('[data-compare-names]').textContent).toBe('None.');
    expect(group(container, 'compare-want').querySelector('[data-compare-names]').textContent).toBe('Nowhere both have marked “Want to go” yet.');
    await waitFor(() => expect(drawCompareMap).toHaveBeenCalled());
    expect(container.querySelector('[data-compare-picture]')).toBeNull();
  });

  it('lets the picture go when it unmounts', async () => {
    const { container, unmount } = render(<CompareResults a={A} b={B} />);
    await waitFor(() => expect(container.querySelector('[data-compare-picture]')).toBeTruthy());
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:compare');
  });
});
