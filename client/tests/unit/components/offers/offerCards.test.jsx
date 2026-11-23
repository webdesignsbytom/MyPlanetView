import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import AdStamp from '@/components/offers/AdStamp';
import OfferBrochure from '@/components/offers/OfferBrochure';
import OfferKindArt from '@/components/offers/OfferKindArt';
import OfferTile from '@/components/offers/OfferTile';

const OFFER = { id: 'o1', title: 'Paris hotels', partner: 'Example Stays', kind: 'HOTEL', blurb: 'Rooms near the Seine.', imageKey: null };
const NAME = 'Ad: Paris hotels. Visit Example Stays (opens in a new tab)';

// Every card is a plain sponsored link to the partner in a new tab, named "Ad: …" first
const expectSponsoredLink = (a, href) => {
  expect(a.tagName).toBe('A');
  expect(a.getAttribute('href')).toBe(href);
  expect(a.getAttribute('target')).toBe('_blank');
  expect(a.getAttribute('rel')).toBe('sponsored noopener');
  expect(a.getAttribute('referrerpolicy')).toBe('no-referrer');
  expect(a.getAttribute('aria-label')).toBe(NAME);
};

describe('AdStamp', () => {
  it('says Ad, hidden from screen readers (the link’s name says it)', () => {
    const { container } = render(<AdStamp className='absolute' />);
    const span = container.querySelector('span');
    expect(span.textContent).toBe('Ad');
    expect(span.getAttribute('aria-hidden')).toBe('true');
    expect(span.className).toContain('absolute');
  });
});

describe('OfferKindArt', () => {
  it('draws the kind’s word and icon, decorative', () => {
    const { container } = render(<OfferKindArt kind='FLIGHT' large />);
    const art = container.firstChild;
    expect(art.getAttribute('aria-hidden')).toBe('true');
    expect(art.querySelector('svg')).toBeTruthy();
    expect(art.textContent.length).toBeGreaterThan(0);
  });

  it('an unknown kind gets the compass and the "other" word', () => {
    const unknown = render(<OfferKindArt kind='SPACESHIP' />).container.textContent;
    const other = render(<OfferKindArt kind='OTHER' />).container.textContent;
    expect(unknown).toBe(other);
  });
});

describe('OfferTile', () => {
  it('is a sponsored link through /go/ with its title and partner', () => {
    const { container } = render(<OfferTile offer={OFFER} href='/go/o1?p=GALLERY' />);
    const a = container.querySelector('a');
    expectSponsoredLink(a, '/go/o1?p=GALLERY');
    expect(a.getAttribute('data-offer-id')).toBe('o1');
    expect(a.textContent).toContain('Paris hotels');
    expect(a.textContent).toContain('Example Stays');
    expect(a.textContent).toContain('Ad');
    // No picture of its own: the kind's stamp
    expect(a.querySelector('img')).toBeNull();
    expect(a.querySelector('[aria-hidden="true"] svg')).toBeTruthy();
  });

  it('shows its own picture, decorative, when it has one', () => {
    const { container } = render(<OfferTile offer={{ ...OFFER, imageKey: 'offers/paris.webp' }} href='/go/o1' />);
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toContain('offers/paris.webp');
    expect(img.getAttribute('alt')).toBe('');
  });

  it('without a link it is a preview: a named group, not a link', () => {
    const { container } = render(<OfferTile offer={OFFER} />);
    expect(container.querySelector('a')).toBeNull();
    const group = container.querySelector('[role="group"]');
    expect(group.getAttribute('aria-label')).toBe('Ad: Paris hotels, Example Stays');
    expect(group.getAttribute('target')).toBeNull();
  });
});

describe('OfferBrochure', () => {
  it('is a sponsored link with the title, partner, blurb and "Visit <partner>"', () => {
    const { container } = render(<OfferBrochure offer={OFFER} href='/go/o1?p=TRAVEL_DESK' />);
    const a = container.querySelector('a');
    expectSponsoredLink(a, '/go/o1?p=TRAVEL_DESK');
    expect(a.getAttribute('data-offer-id')).toBe('o1');
    expect(a.textContent).toContain('Rooms near the Seine.');
    expect(a.textContent).toContain('Visit Example Stays');
    expect(a.className).toContain('grid-rows-[9rem_auto]');
  });

  it('the wide one sits the picture beside the words; no blurb, no blurb line', () => {
    const { container } = render(<OfferBrochure offer={{ ...OFFER, blurb: '', imageKey: 'offers/x.webp' }} href='/go/o1' wide />);
    const a = container.querySelector('a');
    expect(a.className).toContain('sm:grid-cols-[12rem_minmax(0,1fr)]');
    expect(a.querySelector('img').getAttribute('src')).toContain('offers/x.webp');
    expect(a.textContent).not.toContain('Rooms near the Seine.');
  });
});
