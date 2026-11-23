import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TravelDeskDialog from '@/components/offers/TravelDeskDialog';
import TravelDeskShelf from '@/components/offers/TravelDeskShelf';
import TravelDeskWhenToGo from '@/components/offers/TravelDeskWhenToGo';
import useOffers from '@/hooks/useOffers';
import useCountryGuides from '@/hooks/useCountryGuides';
import { PARTNER_OFFERS_NOTE } from '@/utils/offers/offerKinds';

vi.mock('@/hooks/useOffers', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useCountryGuides', () => ({ default: vi.fn() }));

const MONTHS = ['good', 'good', 'good', 'best', 'best', 'best', 'avoid', 'avoid', 'best', 'best', 'good', 'good'];
const GUIDE = { code: 'FR', name: 'France', slug: 'france', months: MONTHS };

const offer = (over) => ({ placements: ['TRAVEL_DESK'], weight: 1, imageKey: null, countryCode: null, ...over });
const OFFERS = [
  offer({ id: 'h-fr', title: 'Paris hotels', partner: 'Example Stays', kind: 'HOTEL', countryCode: 'FR' }),
  offer({ id: 'h-any', title: 'Hotels anywhere', partner: 'Example Beds', kind: 'HOTEL' }),
  offer({ id: 'f-any', title: 'Cheap flights', partner: 'Example Air', kind: 'FLIGHT' }),
  offer({ id: 'h-it', title: 'Rome hotels', partner: 'Example Stays', kind: 'HOTEL', countryCode: 'IT' }),
  offer({ id: 'g-only', title: 'Gallery card', partner: 'Example', kind: 'TOUR', placements: ['GALLERY'] }),
];

const openDesk = (props = {}) =>
  render(
    <MemoryRouter>
      <TravelDeskDialog countryCodes={['FR']} onClose={vi.fn()} {...props} />
    </MemoryRouter>,
  );

describe('TravelDeskWhenToGo', () => {
  it('shows the guide’s months as a list in words, and links to the guide, closing the desk', () => {
    const onLeave = vi.fn();
    const { container } = render(
      <MemoryRouter>
        <TravelDeskWhenToGo guide={GUIDE} onLeave={onLeave} />
      </MemoryRouter>,
    );
    expect(container.querySelector('h3#travel-desk-when-fr').textContent).toBe('When to go: France');
    const list = container.querySelector('ol[aria-label="France, month by month"]');
    expect(list.querySelectorAll('li').length).toBe(12);
    expect(list.textContent).toContain('April');
    const link = screen.getByText('Read our guide to France');
    expect(link.getAttribute('href')).toBe('/countries/france');
    fireEvent.click(link);
    expect(onLeave).toHaveBeenCalled();
  });

  it('has no link on the guide’s own page', () => {
    render(
      <MemoryRouter>
        <TravelDeskWhenToGo guide={GUIDE} linkToGuide={false} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Read our guide to France')).toBeNull();
  });
});

describe('TravelDeskShelf', () => {
  it('is a section titled by its kind, a brochure per offer, each link carrying the desk placement', () => {
    const { container } = render(<TravelDeskShelf kind='HOTEL' offers={OFFERS.slice(0, 2)} countryCodes={['FR']} trip={null} />);
    const section = container.querySelector('section');
    expect(section.getAttribute('aria-labelledby')).toBe('travel-desk-hotel');
    expect(container.querySelector('#travel-desk-hotel').textContent).toBe('Places to stay');
    expect(section.className).toContain('sm:col-span-2');
    const links = [...container.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('data-offer-id'))).toEqual(['h-fr', 'h-any']);
    links.forEach((a) => {
      expect(a.getAttribute('href')).toMatch(/^\/go\/h-(fr|any)\?/);
      expect(new URLSearchParams(a.getAttribute('href').split('?')[1]).get('p')).toBe('TRAVEL_DESK');
      expect(a.getAttribute('rel')).toBe('sponsored noopener');
    });
    expect(new URLSearchParams(links[0].getAttribute('href').split('?')[1]).get('country')).toBe('FR');
  });

  it('a kind it doesn’t know goes on the "More for the trip" shelf title', () => {
    const { container } = render(<TravelDeskShelf kind='BALLOONS' offers={[OFFERS[2]]} countryCodes={['FR']} />);
    expect(container.querySelector('h3').textContent).toBe('More for the trip');
    expect(container.querySelector('section').className).not.toContain('col-span');
  });
});

describe('TravelDeskDialog', () => {
  beforeEach(() => {
    useCountryGuides.mockReturnValue([]);
  });

  it('says it is for the place and shows the partner-offers label', () => {
    useOffers.mockReturnValue({ offers: OFFERS, loading: false, error: null });
    openDesk();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('For France');
    expect(dialog.textContent).toContain(PARTNER_OFFERS_NOTE);
  });

  it('puts the place’s own offers and the general ones on shelves by kind, never another country’s or placement’s', () => {
    useOffers.mockReturnValue({ offers: OFFERS, loading: false, error: null });
    openDesk();
    const dialog = document.querySelector('[role="dialog"]');
    const shelves = [...dialog.querySelectorAll('section[aria-labelledby^="travel-desk-"]')].filter((s) => !s.id && s.querySelector('a'));
    expect(shelves.map((s) => s.querySelector('h3').textContent)).toEqual(['Places to stay', 'Flights']);
    const ids = [...dialog.querySelectorAll('a[data-offer-id]')].map((a) => a.getAttribute('data-offer-id'));
    // France's own first, then the general one
    expect(ids).toEqual(['h-fr', 'h-any', 'f-any']);
  });

  it('names a trip’s places and dates', () => {
    useOffers.mockReturnValue({ offers: [], loading: false, error: null });
    openDesk({ countryCodes: ['FR', 'IT', 'ES'], trip: { from: '2027-05-01', to: '2027-05-10', stops: [] } });
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.textContent).toMatch(/For France, Italy and Spain · .*2027/);
  });

  it('shows a spinner while the offers load', () => {
    useOffers.mockReturnValue({ offers: [], loading: true, error: null });
    openDesk();
    const status = document.querySelector('[role="dialog"] [role="status"]');
    expect(status.textContent).toContain('Fetching the offers…');
  });

  it('says when there are none, and shows an error when the list failed', () => {
    useOffers.mockReturnValue({ offers: [], loading: false, error: null });
    const first = openDesk();
    expect(document.querySelector('[role="dialog"]').textContent).toContain('No partner offers for France yet.');
    first.unmount();
    useOffers.mockReturnValue({ offers: [], loading: false, error: 'Offers are resting.' });
    openDesk();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('Offers are resting.');
    expect(dialog.textContent).not.toContain('No partner offers');
  });

  it('shows when to go from the country’s guide, or the guide on the page without a link', () => {
    useOffers.mockReturnValue({ offers: [], loading: false, error: null });
    useCountryGuides.mockReturnValue([GUIDE]);
    const first = openDesk();
    expect(screen.getByText('When to go: France')).toBeTruthy();
    expect(screen.getByText('Read our guide to France')).toBeTruthy();
    first.unmount();
    openDesk({ guideOnPage: GUIDE });
    expect(useCountryGuides).toHaveBeenLastCalledWith([]);
    expect(screen.getByText('When to go: France')).toBeTruthy();
    expect(screen.queryByText('Read our guide to France')).toBeNull();
  });

  it('closes from its close button', () => {
    useOffers.mockReturnValue({ offers: [], loading: false, error: null });
    const onClose = vi.fn();
    openDesk({ onClose });
    const dialog = document.querySelector('[role="dialog"]');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

describe('TravelDesk', () => {
  it('opens the desk over the page only when pressed, and tells the page', async () => {
    useOffers.mockReturnValue({ offers: OFFERS, loading: false, error: null });
    useCountryGuides.mockReturnValue([]);
    const { default: TravelDesk } = await import('@/components/offers/TravelDesk');
    const onOpen = vi.fn();
    const { container } = render(
      <MemoryRouter>
        <TravelDesk countryCodes={['FR']} onOpen={onOpen} />
      </MemoryRouter>,
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    fireEvent.click(within(container).getByText('Travel Desk').closest('button'));
    expect(onOpen).toHaveBeenCalled();
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeTruthy());
    // Portalled to the page, outside the button's own tree
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.querySelectorAll('a[data-offer-id]').length).toBe(3);
  });
});
