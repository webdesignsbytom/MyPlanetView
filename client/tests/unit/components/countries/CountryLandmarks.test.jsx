import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, within } from '@testing-library/react';
import CountryLandmarks from '@/components/countries/CountryLandmarks';

const photo = { width: 480, height: 360, author: 'Jane Doe', licence: 'CC BY-SA 4.0', licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0', file: 'Eiffel Tower at dusk.jpg' };

const LANDMARKS = [
  { wikidataId: 'Q243', slug: 'eiffel-tower', name: 'Eiffel Tower', category: 'Landmark', matchRadiusM: 800, photo },
  { wikidataId: 'Q2981', slug: 'notre-dame', name: 'Notre-Dame', category: 'Cathedral', matchRadiusM: 1500, photo },
  { wikidataId: 'Q1', slug: 'mont-blanc', name: 'Mont Blanc', category: 'Mountain', matchRadiusM: 20000 },
];

describe('CountryLandmarks', () => {
  it('draws nothing for a country with no landmarks', () => {
    const { container } = render(<CountryLandmarks named='France' landmarks={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('is a card titled with the country as a sentence names it', () => {
    const { container } = render(<CountryLandmarks named='the United Kingdom' landmarks={LANDMARKS} />);
    expect(container.querySelector('#country-landmarks-heading').textContent).toBe('Landmarks in the United Kingdom');
  });

  it('shows each landmark’s category, name and how near a photo must be, in metres or kilometres', () => {
    const { container } = render(<CountryLandmarks named='France' landmarks={LANDMARKS} />);
    const items = container.querySelectorAll('ul > li');
    expect(items.length).toBe(3);
    expect(within(items[0]).getByText('Landmark')).toBeTruthy();
    expect(items[0].querySelector('h3').textContent).toBe('Eiffel Tower');
    expect(items[0].textContent).toContain('Add a photo taken within 800 m of it');
    expect(items[1].textContent).toContain('within 1.5 km of it');
    expect(items[2].textContent).toContain('within 20 km of it');
    expect(items[2].textContent).toContain('your map suggests this landmark for it');
  });

  it('shows a credited photo where the landmark has one, tilted one way then the other', () => {
    const { container } = render(<CountryLandmarks named='France' landmarks={LANDMARKS} />);
    const items = container.querySelectorAll('ul > li');
    const first = items[0].querySelector('figure img');
    expect(first.getAttribute('src')).toMatch(/landmarkPhotos\/eiffel-tower-480\.webp$/);
    expect(first.getAttribute('alt')).toBe('');
    expect(items[0].querySelector('figure > div').className).toContain('-rotate-1');
    expect(items[1].querySelector('figure > div').className).toMatch(/(^| )rotate-1( |$)/);
    expect(within(items[0]).getByText('Jane Doe').getAttribute('href')).toBe(
      'https://commons.wikimedia.org/wiki/File:Eiffel_Tower_at_dusk.jpg',
    );
    // No photo: no figure, the words alone
    expect(items[2].querySelector('figure')).toBeNull();
  });
});
