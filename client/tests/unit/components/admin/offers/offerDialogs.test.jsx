import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminOffersMainContainer from '@/components/admin/offers/AdminOffersMainContainer';
import OfferEditDialog from '@/components/admin/offers/OfferEditDialog';
import OfferImportCard from '@/components/admin/offers/OfferImportCard';
import { createOffer, getAdminOffers, importOffers, updateOffer } from '@/api/offerAdminApi';
import { downloadJson } from '@/utils/offers/offerAdmin';

vi.mock('@/api/offerAdminApi', () => ({
  getAdminOffers: vi.fn(),
  createOffer: vi.fn(),
  updateOffer: vi.fn(),
  deleteOffer: vi.fn(),
  importOffers: vi.fn(),
}));
vi.mock('@/utils/offers/offerAdmin', async (importOriginal) => ({ ...(await importOriginal()), downloadJson: vi.fn() }));

const JP = {
  id: 'o1',
  key: 'example-stays-jp',
  partner: 'Example Stays',
  kind: 'HOTEL',
  title: 'Hotels in Japan',
  blurb: null,
  countryCode: 'JP',
  placements: ['GALLERY'],
  url: 'https://example.com/stays?dest={destination}&in={checkin}',
  imageKey: null,
  weight: 1,
  active: true,
  startsAt: null,
  endsAt: null,
  clicks: { total: 0, byPlacement: {}, byDay: [] },
};
const ANY = { ...JP, id: 'o2', key: 'example-esim', kind: 'ESIM', title: 'eSIMs anywhere', countryCode: null, partner: 'Example SIM' };

const byId = (id) => document.getElementById(id);
const press = async (el) => {
  await act(async () => {
    fireEvent.click(el);
  });
};
const jsonFile = (value, name = 'offers.json') => new File([typeof value === 'string' ? value : JSON.stringify(value)], name, { type: 'application/json' });
const choose = async (file) => {
  await act(async () => {
    fireEvent.change(byId('offer-import-file'), { target: { files: [file] } });
  });
};

beforeEach(() => {
  for (const fn of [getAdminOffers, createOffer, updateOffer, importOffers, downloadJson]) fn.mockReset();
  vi.stubGlobal('requestAnimationFrame', (fn) => setTimeout(fn, 0));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe('OfferEditDialog', { timeout: 20000 }, () => {
  const open = (props = {}) => {
    const onSaved = vi.fn();
    const onClose = vi.fn();
    render(<OfferEditDialog onSaved={onSaved} onClose={onClose} {...props} />);
    return { onSaved, onClose };
  };

  it('starts a new offer on every travel placement, not on prints, and previews its cards', () => {
    open();
    expect(screen.getByText('New offer')).toBeTruthy();
    expect(byId('new-offer-placement-GALLERY').checked).toBe(true);
    expect(byId('new-offer-placement-TRAVEL_DESK').checked).toBe(true);
    expect(byId('new-offer-placement-PRINT').checked).toBe(false);
    expect(byId('new-offer-active').checked).toBe(true);
    expect(byId('new-offer-weight').value).toBe('1');
    expect(screen.getByLabelText('Preview').textContent).toContain('In a photo gallery');
  });

  it('marks every field the rules refuse, and focuses the first', async () => {
    const { onSaved } = open();
    fireEvent.change(byId('new-offer-url'), { target: { value: 'http://example.com/{city}' } });
    fireEvent.change(byId('new-offer-weight'), { target: { value: '0' } });
    for (const p of ['GALLERY', 'SLIDESHOW', 'COUNTRY_PAGE', 'TRAVEL_DESK']) fireEvent.click(byId(`new-offer-placement-${p}`));
    await press(screen.getByText('Make offer'));
    expect(byId('new-offer-key-error').textContent).toBe('A key is 2 to 64 lower-case letters, digits and dashes, starting with a letter or digit.');
    expect(byId('new-offer-partner-error').textContent).toBe('Name the partner.');
    expect(byId('new-offer-title-error').textContent).toBe('Give the card its line, e.g. Hotels in Kyoto.');
    expect(byId('new-offer-url-error').textContent).toMatch(/^The link has \{city\}, which is never filled in/);
    expect(byId('new-offer-placements-error').textContent).toBe('Choose at least one place to show it.');
    expect(byId('new-offer-weight-error').textContent).toMatch(/^A whole number from 1 to /);
    expect(screen.getByText('Check the fields marked above.')).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(byId('new-offer-key')));
    expect(createOffer).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('makes an offer and shows where an example click would go', async () => {
    createOffer.mockResolvedValue({ offer: { ...JP, id: 'new' } });
    const { onSaved } = open();
    fireEvent.change(byId('new-offer-key'), { target: { value: 'Example-Stays-JP' } });
    fireEvent.change(byId('new-offer-partner'), { target: { value: 'Example Stays' } });
    fireEvent.change(byId('new-offer-title'), { target: { value: 'Hotels in Japan' } });
    fireEvent.change(byId('new-offer-country'), { target: { value: 'JP' } });
    fireEvent.change(byId('new-offer-url'), { target: { value: JP.url } });
    expect(screen.getByLabelText('Preview').textContent).toContain('https://example.com/stays?dest=Japan&in=2027-04-02');
    // the country's poster, offered as its picture
    fireEvent.click(screen.getByText('Use Japan’s poster'));
    expect(byId('new-offer-image').value).toMatch(/^visitCountryPosters\/.+-800\.avif$/);
    fireEvent.change(byId('new-offer-last-day'), { target: { value: '2027-08-31' } });
    await press(screen.getByText('Make offer'));
    const body = createOffer.mock.calls[0][0];
    expect(body).toMatchObject({
      key: 'example-stays-jp',
      partner: 'Example Stays',
      title: 'Hotels in Japan',
      kind: 'HOTEL',
      countryCode: 'JP',
      placements: ['GALLERY', 'SLIDESHOW', 'COUNTRY_PAGE', 'TRAVEL_DESK'],
      weight: 1,
      active: true,
      startsAt: null,
      endsAt: '2027-08-31T23:59:59.999Z',
    });
    expect(onSaved).toHaveBeenCalledWith({ ...JP, id: 'new' }, { created: true });
  });

  it('changes an offer, its key fixed', async () => {
    updateOffer.mockResolvedValue({ offer: { ...JP, weight: 3 } });
    const { onSaved } = open({ offer: JP });
    expect(screen.getByText('Change Hotels in Japan')).toBeTruthy();
    expect(byId('edit-offer-key')).toBeNull();
    expect(screen.getByText('example-stays-jp')).toBeTruthy();
    fireEvent.change(byId('edit-offer-weight'), { target: { value: '3' } });
    await press(screen.getByText('Save changes'));
    expect(updateOffer.mock.calls[0][0]).toBe('o1');
    expect(updateOffer.mock.calls[0][1].weight).toBe(3);
    expect(updateOffer.mock.calls[0][1].key).toBeUndefined();
    expect(onSaved).toHaveBeenCalledWith({ ...JP, weight: 3 }, { created: false });
  });

  it('shows the server’s refusal and cancels', async () => {
    updateOffer.mockRejectedValue(new Error('x'));
    const { onClose } = open({ offer: JP });
    await press(screen.getByText('Save changes'));
    expect(screen.getByText('The offer couldn’t be changed.')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('OfferImportCard', () => {
  it('previews a file’s new keys and the keys it updates, then imports it', async () => {
    importOffers.mockResolvedValue({ created: 1, updated: 1 });
    const onImported = vi.fn();
    render(<OfferImportCard offers={[JP]} onImported={onImported} />);
    const payload = { offers: [{ key: 'example-stays-jp' }, { key: 'example-tours-it' }] };
    await choose(jsonFile(payload));
    await waitFor(() => expect(byId('offer-import-plan')).toBeTruthy());
    expect(byId('offer-import-plan').textContent).toBe('offers.json holds 2 offers: 1 new, 1 to update.');
    const plan = byId('offer-import-plan').parentElement;
    expect(plan.textContent).toContain('Newexample-tours-it');
    expect(plan.textContent).toContain('To updateexample-stays-jp');
    await press(screen.getByText('Import 2 offers'));
    expect(importOffers).toHaveBeenCalledWith(payload);
    expect(screen.getByText('Imported: 1 offer made and 1 offer updated.')).toBeTruthy();
    expect(byId('offer-import-plan')).toBeNull();
    expect(onImported).toHaveBeenCalledWith({ created: 1, updated: 1 });
  });

  it('lists a refused import’s problems in words, naming each offer', async () => {
    importOffers.mockRejectedValue(
      Object.assign(new Error('x'), {
        friendlyMessage: 'Nothing was imported.',
        problems: [
          { index: 2, key: 'example-tours-it', field: 'url' },
          { index: null, key: null, field: 'offers' },
        ],
      }),
    );
    render(<OfferImportCard offers={[]} onImported={() => {}} />);
    await choose(jsonFile({ offers: [{ key: 'a1' }, { key: 'a2' }, { key: 'example-tours-it', url: 'http://example.com' }] }));
    await press(await screen.findByText('Import 3 offers'));
    expect(screen.getByText('Nothing was imported.')).toBeTruthy();
    const problems = [...screen.getByLabelText('Problems in the file').querySelectorAll('li')].map((li) => li.textContent);
    expect(problems[0]).toBe('Offer 3 (example-tours-it): the link must start with https://');
    expect(problems[1]).toMatch(/^The file must hold a list of 1 to \d+ offers/);
  });

  it('says what’s wrong with a file it can’t read', async () => {
    render(<OfferImportCard offers={[]} onImported={() => {}} />);
    await choose(jsonFile('{ "offers": [ ', 'broken.json'));
    expect((await screen.findByText(/broken\.json isn’t a JSON file we can read/)).getAttribute('role')).toBe('alert');
    await choose(jsonFile({ partners: [] }, 'other.json'));
    expect(await screen.findByText('other.json doesn’t hold a list of offers: it should look like { "offers": [ … ] }.')).toBeTruthy();
    expect(importOffers).not.toHaveBeenCalled();
  });

  it('cancels a chosen file', async () => {
    render(<OfferImportCard offers={[]} onImported={() => {}} />);
    await choose(jsonFile({ offers: [{ key: 'a1' }] }));
    fireEvent.click(await screen.findByText('Cancel'));
    expect(byId('offer-import-plan')).toBeNull();
  });

  it('downloads the offers as an import file named for the day, and only when there are some', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-22T09:00:00Z'));
    const { rerender } = render(<OfferImportCard offers={[]} onImported={() => {}} />);
    expect(screen.getByText('Download the offers (.json)').disabled).toBe(true);
    rerender(<OfferImportCard offers={[JP, ANY]} onImported={() => {}} />);
    fireEvent.click(screen.getByText('Download the offers (.json)'));
    const [file, name] = downloadJson.mock.calls[0];
    expect(name).toBe('offers-2026-11-22.json');
    expect(file.offers.map((o) => o.key)).toEqual(['example-stays-jp', 'example-esim']);
    // the import's shape: no ids, creation dates or clicks
    expect(file.offers[0].id).toBeUndefined();
    expect(file.offers[0].clicks).toBeUndefined();
    expect(screen.getByText('offers-2026-11-22.json has the 2 offers as an import file.')).toBeTruthy();
  });
});

describe('AdminOffersMainContainer', { timeout: 20000 }, () => {
  it('lists the offers with a count, or says there are none', async () => {
    getAdminOffers.mockResolvedValue({ offers: [JP, ANY], clicksSince: '2026-10-24' });
    const { unmount } = render(<AdminOffersMainContainer />);
    expect(await screen.findByText('2 offers')).toBeTruthy();
    expect(screen.getByText(/here since 24 Oct 2026/)).toBeTruthy();
    expect(byId('offer-o1-heading')).toBeTruthy();
    unmount();
    getAdminOffers.mockResolvedValue({ offers: [] });
    render(<AdminOffersMainContainer />);
    expect(await screen.findByText('No offers yet. Make one, or import a file.')).toBeTruthy();
  });

  it('filters the list, saying how many show', async () => {
    getAdminOffers.mockResolvedValue({ offers: [JP, ANY] });
    render(<AdminOffersMainContainer />);
    await screen.findByText('2 offers');
    fireEvent.change(byId('offer-country-filter'), { target: { value: 'none' } });
    expect(screen.getByText('Showing 1 of 2 offers')).toBeTruthy();
    expect(byId('offer-o1-heading')).toBeNull();
    expect(byId('offer-o2-heading')).toBeTruthy();
    fireEvent.change(byId('offer-search'), { target: { value: 'nothing like it' } });
    expect(screen.getByText('No offers match. Change the filters above.')).toBeTruthy();
  });

  it('says why when the offers can’t be loaded', async () => {
    getAdminOffers.mockRejectedValue(new Error('x'));
    render(<AdminOffersMainContainer />);
    expect((await screen.findByText('The offers couldn’t be loaded.')).getAttribute('role')).toBe('alert');
  });

  it('turns an offer off, keeping its counts, and on again outside its dates', async () => {
    getAdminOffers.mockResolvedValue({ offers: [JP] });
    updateOffer
      .mockResolvedValueOnce({ offer: { ...JP, active: false } })
      .mockResolvedValueOnce({ offer: { ...JP, active: true, endsAt: '2020-01-01T00:00:00Z' } });
    render(<AdminOffersMainContainer />);
    await press(await screen.findByLabelText('Turn off Hotels in Japan'));
    expect(updateOffer).toHaveBeenCalledWith('o1', { active: false });
    expect(screen.getByText('Hotels in Japan is off: it’s on no card and not on the Travel Desk. Its click counts are kept.')).toBeTruthy();
    await press(screen.getByLabelText('Turn on Hotels in Japan'));
    expect(screen.getByText('Hotels in Japan is on, but outside its dates (ended), so it isn’t showing.')).toBeTruthy();
  });

  it('adds a new offer in order, and removes a deleted one', async () => {
    getAdminOffers.mockResolvedValue({ offers: [ANY] });
    createOffer.mockResolvedValue({ offer: JP });
    const { deleteOffer } = await import('@/api/offerAdminApi');
    deleteOffer.mockResolvedValue({});
    render(<AdminOffersMainContainer />);
    await screen.findByText('1 offer');
    fireEvent.click(screen.getByText('New offer'));
    fireEvent.change(byId('new-offer-key'), { target: { value: 'example-stays-jp' } });
    fireEvent.change(byId('new-offer-partner'), { target: { value: 'Example Stays' } });
    fireEvent.change(byId('new-offer-title'), { target: { value: 'Hotels in Japan' } });
    fireEvent.change(byId('new-offer-url'), { target: { value: 'https://example.com/' } });
    await press(within(document.querySelector('[role="dialog"]')).getByText('Make offer'));
    expect(screen.getByText('Hotels in Japan is made (example-stays-jp).')).toBeTruthy();
    // by country, offers for anywhere last
    const headings = [...screen.getByLabelText('List of offers').querySelectorAll('h3')].map((h) => h.textContent);
    expect(headings).toEqual(['Hotels in Japan', 'eSIMs anywhere']);
    fireEvent.click(screen.getByLabelText('Delete eSIMs anywhere'));
    await press(screen.getByText('Delete offer and counts'));
    expect(screen.getByText('eSIMs anywhere is deleted, with its click counts.')).toBeTruthy();
    expect(byId('offer-o2-heading')).toBeNull();
  });

  it('reloads the list after an import', async () => {
    getAdminOffers.mockResolvedValue({ offers: [JP] });
    importOffers.mockResolvedValue({ created: 0, updated: 1 });
    render(<AdminOffersMainContainer />);
    await screen.findByText('1 offer');
    await choose(jsonFile({ offers: [{ key: 'example-stays-jp' }] }));
    await press(await screen.findByText('Import 1 offer'));
    expect(screen.getByText('Imported: 1 offer updated.')).toBeTruthy();
    expect(getAdminOffers).toHaveBeenCalledTimes(2);
  });
});
