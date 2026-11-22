import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CountryTravelOffers from '@/components/countries/CountryTravelOffers';
import { getOffers } from '@/api/offersApi';
import { PARTNER_OFFERS_NOTE } from '@/utils/offers/offerKinds';

vi.mock('@/api/offersApi', async (importOriginal) => ({ ...(await importOriginal()), getOffers: vi.fn() }));

const offer = (id, overrides = {}) => ({
  id,
  partner: `Partner ${id}`,
  kind: 'HOTEL',
  title: `Offer ${id}`,
  blurb: '',
  countryCode: 'FR',
  placements: ['COUNTRY_PAGE'],
  imageKey: null,
  weight: 1,
  ...overrides,
});

const guide = { code: 'FR', name: 'France', slug: 'france', months: Array(12).fill('good') };

const show = () =>
  render(
    <MemoryRouter>
      <CountryTravelOffers guide={guide} named='France' />
    </MemoryRouter>,
  );

const cards = (container) => [...container.querySelectorAll('a[data-offer-id]')];

describe('CountryTravelOffers', () => {
  beforeEach(() => {
    getOffers.mockReset();
  });

  it('says what the offers are and has the Travel Desk, before any offer arrives', () => {
    getOffers.mockReturnValue(new Promise(() => {}));
    const { container, getByText } = show();
    expect(container.querySelector('#country-offers-heading').textContent).toBe('Plan your trip');
    expect(container.textContent).toContain('travel insurance for France, from our travel partners');
    expect(getByText('Travel Desk').closest('button')).toBeTruthy();
    expect(getByText(PARTNER_OFFERS_NOTE)).toBeTruthy();
    expect(cards(container)).toEqual([]);
  });

  it('shows two of the country’s offers, of two kinds, each through the click link', async () => {
    getOffers.mockResolvedValue([
      offer('h1'),
      offer('h2'),
      offer('t1', { kind: 'TOUR' }),
      offer('es', { countryCode: 'ES' }),
      offer('desk', { placements: ['TRAVEL_DESK'] }),
    ]);
    const { container } = show();
    await waitFor(() => expect(cards(container).length).toBe(2));
    const shown = cards(container);
    const ids = shown.map((a) => a.getAttribute('data-offer-id'));
    expect(ids).toContain('t1');
    expect(ids.some((id) => id === 'h1' || id === 'h2')).toBe(true);
    for (const a of shown) {
      expect(a.getAttribute('href')).toBe(`/go/${a.getAttribute('data-offer-id')}?p=COUNTRY_PAGE&dest=France&country=FR`);
    }
  });

  it('falls back on general offers when the country has none', async () => {
    getOffers.mockResolvedValue([offer('g1', { countryCode: null, kind: 'INSURANCE' }), offer('it', { countryCode: 'IT' })]);
    const { container } = show();
    await waitFor(() => expect(cards(container).length).toBe(1));
    expect(cards(container)[0].getAttribute('data-offer-id')).toBe('g1');
    expect(cards(container)[0].getAttribute('href')).toBe('/go/g1?p=COUNTRY_PAGE&dest=France&country=FR');
  });

  it('shows no cards when no offer fits, or the list can’t be had', async () => {
    getOffers.mockRejectedValue(Object.assign(new Error('down'), { friendlyMessage: 'Down.' }));
    const { container } = show();
    await waitFor(() => expect(getOffers).toHaveBeenCalled());
    expect(cards(container)).toEqual([]);
    expect(container.querySelector('ul')).toBeNull();
  });
});
