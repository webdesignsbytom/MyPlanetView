import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import OfferItem from '@/components/admin/offers/OfferItem';
import OfferClicks from '@/components/admin/offers/OfferClicks';
import OfferClickBars from '@/components/admin/offers/OfferClickBars';
import OfferPicture from '@/components/admin/offers/OfferPicture';
import OfferCardPreview from '@/components/admin/offers/OfferCardPreview';
import OfferFilters from '@/components/admin/offers/OfferFilters';
import OfferDeleteDialog from '@/components/admin/offers/OfferDeleteDialog';
import { deleteOffer } from '@/api/offerAdminApi';
import { NO_COUNTRY, emptyOfferFilters } from '@/utils/offers/offerAdmin';

vi.mock('@/api/offerAdminApi', () => ({ deleteOffer: vi.fn() }));

const OFFER = {
  id: 'o1',
  key: 'example-stays-jp',
  partner: 'Example Stays',
  kind: 'HOTEL',
  title: 'Hotels in Japan',
  blurb: 'Rooms near the sights.',
  countryCode: 'JP',
  placements: ['GALLERY', 'TRAVEL_DESK'],
  url: 'https://example.com/stays?dest={destination}',
  imageKey: null,
  weight: 2,
  active: true,
  startsAt: null,
  endsAt: '2099-08-31T23:59:59.999Z',
  clicks: {
    total: 7,
    byPlacement: { GALLERY: 5, TRAVEL_DESK: 2, SLIDESHOW: 0 },
    byDay: [
      { day: '2026-11-03', count: 2 },
      { day: '2026-11-10', count: 5 },
    ],
  },
};
const SINCE = '2026-10-24';

beforeEach(() => {
  deleteOffer.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('OfferItem', () => {
  const draw = (props = {}) => {
    const handlers = { onEdit: vi.fn(), onToggle: vi.fn(), onDelete: vi.fn() };
    render(<OfferItem offer={OFFER} since={SINCE} busy={false} {...handlers} {...props} />);
    return { ...handlers, card: document.querySelector('article') };
  };

  it('shows the offer: title, partner and kind, key, state, country, places, weight, dates and link', () => {
    const { card } = draw();
    expect(card.getAttribute('aria-labelledby')).toBe('offer-o1-heading');
    expect(document.getElementById('offer-o1-heading').textContent).toBe('Hotels in Japan');
    expect(card.textContent).toContain('Example Stays · Hotels');
    expect(card.textContent).toContain('example-stays-jp');
    expect(card.textContent).toContain('On');
    expect(card.textContent).toContain('Japan');
    expect(card.textContent).toContain('Photo galleries, Travel Desk');
    expect(card.textContent).toContain('Until 31 Aug 2099');
    expect(card.textContent).toContain(OFFER.url);
    expect(card.textContent).toContain('Rooms near the sights.');
  });

  it('changes, turns off and deletes, locked while busy', () => {
    const { onEdit, onToggle, onDelete } = draw();
    fireEvent.click(screen.getByLabelText('Change Hotels in Japan'));
    fireEvent.click(screen.getByLabelText('Turn off Hotels in Japan'));
    fireEvent.click(screen.getByLabelText('Delete Hotels in Japan'));
    expect(onEdit).toHaveBeenCalledWith(OFFER);
    expect(onToggle).toHaveBeenCalledWith(OFFER);
    expect(onDelete).toHaveBeenCalledWith(OFFER);
    document.body.innerHTML = '';
    draw({ busy: true, offer: { ...OFFER, active: false } });
    expect(screen.getByLabelText('Turn on Hotels in Japan').disabled).toBe(true);
    expect(screen.getByLabelText('Delete Hotels in Japan').disabled).toBe(true);
    expect(document.querySelector('article').textContent).toContain('Off');
  });
});

describe('OfferClicks and OfferClickBars', () => {
  it('shows 30 days’ clicks, per placement and by day', () => {
    render(<OfferClicks offer={OFFER} since={SINCE} />);
    expect(screen.getByText('7')).toBeTruthy();
    const placements = [...document.querySelectorAll('dl dt')].map((dt) => dt.textContent);
    // every place it shows, plus any it was clicked from
    expect(placements).toEqual(['Photo galleries', 'Travel Desk']);
    expect(screen.getByText('Clicks by day')).toBeTruthy();
    const days = [...document.querySelectorAll('details li')].map((li) => li.textContent);
    expect(days).toEqual(['3 Nov: 2 clicks', '10 Nov: 5 clicks']);
    expect(document.querySelector('svg[role="img"]')).toBeTruthy();
  });

  it('says when there were no clicks', () => {
    render(<OfferClicks offer={{ ...OFFER, clicks: undefined }} since={SINCE} />);
    expect(screen.getByText('No clicks in the last 30 days.')).toBeTruthy();
    expect(document.querySelector('details')).toBeNull();
    expect(document.querySelector('svg')).toBeNull();
  });

  it('draws a bar per day with clicks, named for screen readers, with numbers on hover', () => {
    const { container } = render(<OfferClickBars byDay={OFFER.clicks.byDay} since={SINCE} />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('aria-label')).toBe('Clicks per day, 24 Oct to 22 Nov: most on 10 Nov, 5 clicks.');
    const columns = svg.querySelectorAll('g');
    expect(columns.length).toBe(30);
    const bars = [...columns].filter((g) => g.querySelectorAll('rect').length === 2);
    expect(bars.length).toBe(2);
    expect(columns[0].querySelector('title').textContent).toBe('24 Oct: 0 clicks');
    expect(container.textContent).toContain('most 5 a day');
  });
});

describe('OfferPicture', () => {
  it('draws the kind’s art without a picture, and when the picture fails', () => {
    const { container, rerender } = render(<OfferPicture imageKey={null} kind='HOTEL' />);
    expect(container.querySelector('img')).toBeNull();
    const art = container.firstChild.innerHTML;
    expect(art.length).toBeGreaterThan(0);
    rerender(<OfferPicture imageKey='visitCountryPosters/jp-800.avif' kind='HOTEL' />);
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toContain('visitCountryPosters/jp-800.avif');
    expect(img.getAttribute('alt')).toBe('');
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('OfferCardPreview', () => {
  it('shows the gallery tile and the brochure for the places ticked, or asks for one', () => {
    const { container, rerender } = render(<OfferCardPreview offer={OFFER} placements={['GALLERY', 'TRAVEL_DESK']} />);
    expect(screen.getByText('In a photo gallery')).toBeTruthy();
    expect(screen.getByText('On the Travel Desk, country pages and slideshows')).toBeTruthy();
    // the brochure's link can't be followed from the preview
    expect(container.querySelector('[inert]')).toBeTruthy();
    rerender(<OfferCardPreview offer={OFFER} placements={['GALLERY']} />);
    expect(screen.queryByText('On the Travel Desk, country pages and slideshows')).toBeNull();
    rerender(<OfferCardPreview offer={OFFER} placements={[]} />);
    expect(screen.getByText('Tick where it shows to see its card.')).toBeTruthy();
  });
});

describe('OfferFilters', () => {
  it('passes on the search and the kind, country and state filters, with general offers as a country', () => {
    const onChange = vi.fn();
    render(<OfferFilters filters={emptyOfferFilters()} countryOptions={[{ value: 'JP', label: 'Japan' }]} onChange={onChange} />);
    expect(screen.getByLabelText('Filter offers').getAttribute('role')).toBe('search');
    fireEvent.change(document.getElementById('offer-search'), { target: { value: 'kyoto' } });
    expect(onChange).toHaveBeenCalledWith('search', 'kyoto');
    fireEvent.change(document.getElementById('offer-kind-filter'), { target: { value: 'TOUR' } });
    expect(onChange).toHaveBeenCalledWith('kind', 'TOUR');
    const country = document.getElementById('offer-country-filter');
    expect([...country.querySelectorAll('option')].map((o) => o.textContent)).toEqual(['Every country', 'Anywhere (general offers)', 'Japan']);
    fireEvent.change(country, { target: { value: NO_COUNTRY } });
    expect(onChange).toHaveBeenCalledWith('country', NO_COUNTRY);
    fireEvent.change(document.getElementById('offer-state-filter'), { target: { value: 'scheduled' } });
    expect(onChange).toHaveBeenCalledWith('state', 'scheduled');
  });
});

describe('OfferDeleteDialog', () => {
  it('says the counts go too, and deletes', async () => {
    deleteOffer.mockResolvedValue({});
    const onDeleted = vi.fn();
    render(<OfferDeleteDialog offer={OFFER} onDeleted={onDeleted} onClose={() => {}} />);
    expect(screen.getByText('Delete Hotels in Japan?')).toBeTruthy();
    expect(screen.getByText(/7 clicks in the last 30 days/)).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText('Delete offer and counts')));
    expect(deleteOffer).toHaveBeenCalledWith('o1');
    expect(onDeleted).toHaveBeenCalledWith(OFFER);
  });

  it('keeps it on a refusal, and cancels', async () => {
    deleteOffer.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Not allowed.' }));
    const onClose = vi.fn();
    render(<OfferDeleteDialog offer={OFFER} onDeleted={() => {}} onClose={onClose} />);
    await act(async () => fireEvent.click(screen.getByText('Delete offer and counts')));
    expect(screen.getByText('Not allowed.').getAttribute('role')).toBe('alert');
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});
