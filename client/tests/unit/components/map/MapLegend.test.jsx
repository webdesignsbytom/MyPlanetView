import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import MapLegend from '@/components/map/MapLegend';

const rows = (props) => {
  const { container } = render(<MapLegend {...props} />);
  const list = container.querySelector('ul');
  return { list, words: [...list.querySelectorAll('li')].map((li) => li.textContent.trim()) };
};

describe('MapLegend', () => {
  it('always explains the badges and "want to go", and moments by default', () => {
    const { list, words } = rows();
    expect(list.getAttribute('aria-label')).toBe('Map key');
    expect(words).toEqual(['Visited', 'Lived there', 'Special place', 'Want to go', 'Moments']);
  });

  it('adds the planned trip outline only once one shows', () => {
    expect(rows({ showPlanned: true }).words).toContain('Planned trip');
    expect(rows().words).not.toContain('Planned trip');
  });

  it('adds the moment spots only while moments show', () => {
    expect(rows({ showSpots: true }).words).toContain('A moment’s spot');
    const hidden = rows({ showSpots: true, showMoments: false }).words;
    expect(hidden).not.toContain('A moment’s spot');
    expect(hidden).not.toContain('Moments');
  });

  it('adds the stamped landmark once the map has one', () => {
    expect(rows({ showStamps: true }).words).toContain('Stamped landmark');
    expect(rows().words).not.toContain('Stamped landmark');
  });

  it('draws every mark hidden from screen readers (the words say it)', () => {
    const { list } = rows({ showPlanned: true, showSpots: true, showStamps: true });
    for (const li of list.querySelectorAll('li')) {
      expect(li.firstElementChild.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
