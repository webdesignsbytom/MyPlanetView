import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import PassportLeaf from '@/components/passport/PassportLeaf';
import PassportBackPage from '@/components/passport/PassportBackPage';
import PassportPhotoPage from '@/components/passport/PassportPhotoPage';
import PassportCover from '@/components/passport/PassportCover';
import { CONTINENT_TOTAL, SPECIAL_PLACE_TOTAL } from '@/utils/map/specialPlaces';

// The figure a stats tile shows, by its label
const tile = (label) => screen.getByText(label).closest('div').querySelector('dd').textContent;

describe('PassportLeaf', () => {
  it('is a section named by its page’s heading, with the running head and its number', () => {
    const { container } = render(
      <PassportLeaf pageNumber={4} labelledBy='page-heading'>
        <h2 id='page-heading'>Italy</h2>
        <p>Stamps go here</p>
      </PassportLeaf>,
    );
    const section = container.querySelector('section');
    expect(section.getAttribute('aria-labelledby')).toBe('page-heading');
    expect(section.className).toContain('passport-pages');
    expect(screen.getByText('Stamps go here')).toBeTruthy();
    // The number at the foot, read as "Page 4"
    const foot = section.lastElementChild.previousElementSibling;
    expect(foot.textContent).toBe('Page 4');
    // The running head is the site's name, decoration only
    const head = section.firstElementChild;
    expect(head.getAttribute('aria-hidden')).toBe('true');
    expect(head.textContent).toContain('My Planet View');
    // The fold down the middle, drawn on wide screens
    expect(section.querySelector('.passport-fold').getAttribute('aria-hidden')).toBe('true');
  });
});

describe('PassportBackPage', () => {
  const totals = { countries: 12, continents: 4, specialPlaces: 1, regions: 0, landmarks: 9, unesco: 5 };

  it('shows the passport’s totals, the continents and special places out of how many there are', () => {
    const { container } = render(<PassportBackPage totals={totals} hasVisas pageNumber={9} headingId='totals' />);
    expect(screen.getByText('Totals').id).toBe('totals');
    expect(container.querySelector('section').getAttribute('aria-labelledby')).toBe('totals');
    expect(tile('Countries')).toBe('12');
    expect(tile('Continents')).toBe(`4 of ${CONTINENT_TOTAL}`);
    expect(tile('Special places')).toBe(`1 of ${SPECIAL_PLACE_TOTAL}`);
    expect(tile('Landmarks stamped')).toBe('9');
    expect(tile('UNESCO sites')).toBe('5');
    expect(container.querySelector('section').querySelector(':scope > p:last-of-type').textContent).toBe('Page 9');
  });

  it('shows regions only once there is one', () => {
    render(<PassportBackPage totals={totals} hasVisas pageNumber={9} headingId='totals' />);
    expect(screen.queryByText('Regions')).toBeNull();
    render(<PassportBackPage totals={{ ...totals, regions: 2 }} hasVisas pageNumber={9} headingId='totals-2' />);
    expect(tile('Regions')).toBe('2');
  });

  it('explains how stamps work, and says when there are no visa pages yet', () => {
    const { rerender } = render(<PassportBackPage totals={totals} hasVisas pageNumber={3} headingId='totals' />);
    const how = screen.getByText('How stamps work').closest('section');
    expect(how.getAttribute('aria-labelledby')).toBe('totals-how');
    expect(how.textContent).not.toContain('No visa pages yet.');
    expect(how.textContent).toContain('no photo, no stamp');
    rerender(<PassportBackPage totals={totals} hasVisas={false} pageNumber={3} headingId='totals' />);
    expect(screen.getByText('How stamps work').closest('section').textContent).toContain('No visa pages yet. A country gets its page');
  });
});

describe('PassportPhotoPage', () => {
  const travellers = [
    { id: 't1', name: 'Charlie Reid', birthCountryCode: 'GB', favouriteCountryCode: 'JP' },
    { id: 't2', name: 'Alex', birthCountryCode: null, favouriteCountryCode: null },
  ];

  it('lays out each traveller as a passport’s holder', () => {
    const { container } = render(<PassportPhotoPage travellers={travellers} pageNumber={2} headingId='travellers' />);
    expect(screen.getByText('Travellers').id).toBe('travellers');
    const [charlie, alex] = container.querySelectorAll('li');
    expect(within(charlie).getByText('CR').getAttribute('aria-hidden')).toBe('true');
    expect(within(charlie).getByText('Charlie Reid')).toBeTruthy();
    expect(within(charlie).getByText('United Kingdom')).toBeTruthy();
    expect(within(charlie).getByText('Japan')).toBeTruthy();
    expect(within(alex).getByText('A')).toBeTruthy();
    expect(within(alex).getAllByText('Not given').length).toBe(2);
  });

  // 24 Nov 2026, the user's wish: the 3:4 box stopped a line short of the details
  it('stretches each photo box to the full height of the details beside it', () => {
    const { container } = render(<PassportPhotoPage travellers={travellers} pageNumber={2} headingId='travellers' />);
    for (const card of container.querySelectorAll('li')) {
      // Stretched in its row (no items-start), with no fixed shape, never shorter than 3:4
      expect(card.className).not.toContain('items-start');
      const photo = card.querySelector('[data-passport-photo]');
      expect(photo.className).not.toContain('aspect-');
      expect(photo.className).toContain('min-h-[6.75rem]');
    }
  });

  it('prints the machine-readable line from the names, 44 characters long', () => {
    const { container } = render(<PassportPhotoPage travellers={travellers} pageNumber={2} headingId='travellers' />);
    const line = container.querySelector('p.font-mono');
    expect(line.getAttribute('aria-hidden')).toBe('true');
    expect(line.textContent).toBe('P<MPV<<CHARLIE<REID<<ALEX'.padEnd(44, '<'));
    expect(line.textContent.length).toBe(44);
  });

  it('says when the map has no travellers yet', () => {
    const { container } = render(<PassportPhotoPage travellers={[]} pageNumber={2} headingId='travellers' />);
    expect(screen.getByText('No travellers on this map yet.')).toBeTruthy();
    expect(container.querySelector('p.font-mono')).toBeNull();
  });
});

describe('PassportCover', () => {
  const cover = (map) => render(<PassportCover map={map} headingId='cover' />).container.querySelector('section');

  it('is Economy’s burgundy cover by default, with the map’s name and the class', () => {
    const section = cover({ name: 'Charlie & Alex’s travels', plan: null });
    expect(section.getAttribute('data-cover')).toBe('FREE');
    expect(section.getAttribute('aria-labelledby')).toBe('cover');
    expect(within(section).getByText('Passport').id).toBe('cover');
    expect(within(section).getByText('Charlie & Alex’s travels')).toBeTruthy();
    expect(within(section).getByText('Economy')).toBeTruthy();
    expect(within(section).getByText('My Planet View')).toBeTruthy();
    // No frame on Economy
    expect(section.querySelector('.foil-raise.border-2')).toBeNull();
    expect(section.querySelector('[class*="border-[var(--cover-shade)]"]')).toBeNull();
  });

  it('presses a blind frame into Business Class', () => {
    const section = cover({ name: 'Map', plan: { id: 'REGULAR' } });
    expect(section.getAttribute('data-cover')).toBe('REGULAR');
    expect(within(section).getByText('Business Class')).toBeTruthy();
    expect(section.querySelector('[class*="border-[var(--cover-shade)]"]')).not.toBeNull();
  });

  it('stamps a foil frame on First Class', () => {
    const section = cover({ name: 'Map', plan: { id: 'PREMIUM' } });
    expect(within(section).getByText('First Class')).toBeTruthy();
    expect(section.querySelector('span.foil-raise.border-2')).not.toBeNull();
  });

  it('carries one traveller’s name on their own passport', () => {
    const section = cover({ name: 'The Morgans', plan: null, traveller: { id: 't1', name: 'Charlie' } });
    expect(within(section).getByText('Charlie')).toBeTruthy();
    expect(within(section).queryByText('The Morgans')).toBeNull();
  });

  it('carries the crest and the e-passport mark as decoration', () => {
    const section = cover({ name: 'Map', plan: null });
    const svgs = section.querySelectorAll('svg');
    expect(svgs.length).toBe(2);
    svgs.forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'));
  });
});
