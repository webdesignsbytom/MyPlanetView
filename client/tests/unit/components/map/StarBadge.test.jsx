import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ExpeditionStampIcon, PlaceBadgeIcon, StarBadgeIcon, StarBadgeSymbols } from '@/components/map/StarBadge';
import { BADGE_IDS } from '@/utils/map/badges';

describe('StarBadgeSymbols', () => {
  it('defines the four badges once, by the ids the map uses', () => {
    const { container } = render(
      <svg>
        <StarBadgeSymbols />
      </svg>,
    );
    for (const id of Object.values(BADGE_IDS)) expect(container.querySelector(`symbol#${id}`)).not.toBeNull();
    // The star sticker's disc: red for visited, blue for lived there
    expect(container.querySelector(`#${BADGE_IDS.VISITED} circle`).getAttribute('class')).toContain('fill-poster-red');
    expect(container.querySelector(`#${BADGE_IDS.LIVED} circle`).getAttribute('class')).toContain('fill-colour7');
    // The expedition stamp has a flag on its peak
    expect(container.querySelector(`#${BADGE_IDS.EXPEDITION_VISITED} line`)).not.toBeNull();
    expect(container.querySelector(`#${BADGE_IDS.EXPEDITION_LIVED} polygon:last-of-type`).getAttribute('class')).toContain('fill-colour7');
  });
});

describe('badge icons', () => {
  it('draws the star sticker in HTML, hidden from screen readers', () => {
    const { container } = render(<StarBadgeIcon />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('class')).toBe('h-5 w-5');
    expect(svg.querySelector('circle').getAttribute('class')).toContain('fill-poster-red');
  });

  it('inks the lived-in star blue and takes a class', () => {
    const { container } = render(<StarBadgeIcon lived className='h-9 w-9' />);
    expect(container.querySelector('svg').getAttribute('class')).toBe('h-9 w-9');
    expect(container.querySelector('circle').getAttribute('class')).toContain('fill-colour7');
  });

  it('draws the expedition stamp', () => {
    const { container } = render(<ExpeditionStampIcon />);
    expect(container.querySelector('line')).not.toBeNull();
    expect(container.querySelectorAll('polygon').length).toBe(5);
  });

  it('gives a special place the stamp and a country the star', () => {
    const { container: pole } = render(<PlaceBadgeIcon code='XS' />);
    expect(pole.querySelector('line')).not.toBeNull();
    const { container: country } = render(<PlaceBadgeIcon code='FR' lived />);
    expect(country.querySelector('line')).toBeNull();
    expect(country.querySelector('circle').getAttribute('class')).toContain('fill-colour7');
  });
});
