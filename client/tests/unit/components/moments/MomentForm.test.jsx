import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MomentForm from '@/components/moments/MomentForm';
import MomentDateFields from '@/components/moments/MomentDateFields';
import MomentPhotoPicker from '@/components/moments/MomentPhotoPicker';
import MomentSpotField from '@/components/moments/MomentSpotField';
import MomentSpotPicker from '@/components/moments/MomentSpotPicker';
import { createMoment, getPhoto, updateMoment } from '@/api/travelApi';
import usePhotoPage from '@/hooks/usePhotoPage';
import useLandmarks from '@/hooks/useLandmarks';

vi.mock('@/api/travelApi', () => ({ createMoment: vi.fn(), updateMoment: vi.fn(), getPhoto: vi.fn() }));
vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useLandmarks', () => ({ default: vi.fn() }));
// The world map's own drawing is the map tests'; here, only what the picker does with a tap
vi.mock('@/hooks/useMapViewport', () => ({ default: () => ({ focusOn: vi.fn(), afterTap: (fn) => fn() }) }));
vi.mock('@/components/map/WorldMap', () => ({ default: ({ label }) => <svg data-world-map aria-label={label} /> }));
vi.mock('@/components/map/MapBackground', () => ({ default: () => null }));
vi.mock('@/components/map/MapZoomControls', () => ({ default: () => <button type='button'>Zoom in</button> }));

const pageOf = (photos, extra = {}) => ({ photos, loading: false, error: null, nextCursor: null, loadMore: vi.fn(), ...extra });

beforeEach(() => {
  vi.clearAllMocks();
  usePhotoPage.mockReturnValue(pageOf([]));
  useLandmarks.mockReturnValue({ landmarks: [] });
});

describe('MomentDateFields', () => {
  const fields = (value) => {
    const onChange = vi.fn();
    render(<MomentDateFields idPrefix='d' value={{ precision: 'NONE', day: '', month: '', year: '', ...value }} onChange={onChange} />);
    return onChange;
  };

  it('asks only “When” for no date', () => {
    fields({});
    expect(screen.getByLabelText('When').value).toBe('NONE');
    expect(screen.queryByLabelText('Day')).toBeNull();
    expect(screen.queryByLabelText('Year')).toBeNull();
  });

  it('asks for a day, a month and year, or only the year', () => {
    const { unmount } = render(<MomentDateFields idPrefix='a' value={{ precision: 'DAY', day: '2019-06-14', month: '', year: '' }} onChange={() => {}} />);
    expect(screen.getByLabelText('Day').value).toBe('2019-06-14');
    unmount();
    const onChange = fields({ precision: 'MONTH', month: '06', year: '2019' });
    expect(screen.getByLabelText('Month').value).toBe('06');
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2020' } });
    expect(onChange).toHaveBeenCalledWith({ precision: 'MONTH', day: '', month: '06', year: '2020' });
  });

  it('changes how much is known', () => {
    const onChange = fields({});
    fireEvent.change(screen.getByLabelText('When'), { target: { value: 'YEAR' } });
    expect(onChange).toHaveBeenCalledWith({ precision: 'YEAR', day: '', month: '', year: '' });
  });
});

describe('MomentPhotoPicker', () => {
  const PHOTOS = [
    { id: 'p1', caption: 'One', thumbUrl: '/1.jpg' },
    { id: 'p2', caption: 'Two', thumbUrl: '/2.jpg' },
  ];

  it('counts the chosen photos, showing them while closed, and loads the list only once opened', () => {
    render(<MomentPhotoPicker idPrefix='x' source={{ mapId: 'm1', country: 'FR' }} chosen={[{ id: 'p9', thumbUrl: '/9.jpg' }]} onChange={() => {}} />);
    expect(screen.getByText('1 of 20 chosen')).toBeTruthy();
    expect(screen.getByLabelText('Chosen photos').querySelectorAll('img').length).toBe(1);
    expect(usePhotoPage).toHaveBeenLastCalledWith({ mapId: 'm1', country: 'FR', enabled: false });
    fireEvent.click(screen.getByText('Choose photos'));
    expect(usePhotoPage).toHaveBeenLastCalledWith({ mapId: 'm1', country: 'FR', enabled: true });
    expect(screen.getByText('Done choosing photos').getAttribute('aria-expanded')).toBe('true');
  });

  it('ticks and unticks photos, chosen ones from elsewhere listed first', () => {
    usePhotoPage.mockReturnValue(pageOf(PHOTOS));
    const onChange = vi.fn();
    render(<MomentPhotoPicker idPrefix='x' source={{ mapId: 'm1' }} chosen={[{ id: 'p9', thumbUrl: '/9.jpg' }, { id: 'p2', thumbUrl: '/2.jpg' }]} onChange={onChange} />);
    fireEvent.click(screen.getByText('Choose photos'));
    const tiles = [...document.querySelectorAll('button[aria-pressed]')];
    expect(tiles.map((t) => t.textContent)).toEqual(['A chosen photo', 'One', 'Two']);
    expect(tiles[2].getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(tiles[1]);
    expect(onChange).toHaveBeenLastCalledWith([{ id: 'p9', thumbUrl: '/9.jpg' }, { id: 'p2', thumbUrl: '/2.jpg' }, { id: 'p1', thumbUrl: '/1.jpg' }]);
    fireEvent.click(tiles[2]);
    expect(onChange).toHaveBeenLastCalledWith([{ id: 'p9', thumbUrl: '/9.jpg' }]);
  });

  it('stops at its most, saying so', () => {
    usePhotoPage.mockReturnValue(pageOf(PHOTOS));
    render(<MomentPhotoPicker idPrefix='x' source={{}} chosen={[{ id: 'p1' }]} max={1} fullText='Full up.' onChange={() => {}} />);
    fireEvent.click(screen.getByText('Choose photos'));
    expect(screen.getByText('1 of 1 chosen')).toBeTruthy();
    expect(screen.getByText('Full up.')).toBeTruthy();
    const tiles = document.querySelectorAll('button[aria-pressed]');
    expect(tiles[1].disabled).toBe(true);
    expect(tiles[0].disabled).toBe(false);
  });

  it('can list the whole map’s photos for a map editor', () => {
    render(<MomentPhotoPicker idPrefix='x' source={{ tripId: 't1' }} wholeMap={{ mapId: 'm1' }} chosen={[]} onChange={() => {}} />);
    fireEvent.click(screen.getByText('Choose photos'));
    expect(screen.getByText('No photos here yet.')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Show photos from anywhere on the map'));
    expect(usePhotoPage).toHaveBeenLastCalledWith({ mapId: 'm1', enabled: true });
  });
});

describe('MomentSpotField', () => {
  const SPOT = { latitude: 48.8584, longitude: 2.2945, shared: false };

  it('offers an optional pin, with no photo to take it from', () => {
    render(<MomentSpotField idPrefix='s' value={null} onChange={() => {}} countryCode='FR' />);
    expect(screen.getByText('Optional: put the moment on its exact spot.')).toBeTruthy();
    expect(screen.getByText('Use a photo’s location').closest('button').disabled).toBe(true);
    expect(screen.queryByText('Take the pin off')).toBeNull();
  });

  it('shows a pin, linked to Google Maps, private until shared', () => {
    const onChange = vi.fn();
    render(<MomentSpotField idPrefix='s' value={SPOT} onChange={onChange} countryCode='FR' />);
    expect(screen.getByText(/Pinned at 48\.85840° N, 2\.29450° E/)).toBeTruthy();
    expect(screen.getByText('Check it on Google Maps').closest('a').getAttribute('href')).toContain('query=48.858400%2C2.294500');
    expect(screen.getByText('Only you and the map’s editors see this spot.')).toBeTruthy();
    const shared = screen.getByLabelText('Show the exact spot to everyone the map is shared with');
    expect(shared.checked).toBe(false);
    fireEvent.click(shared);
    expect(onChange).toHaveBeenLastCalledWith({ ...SPOT, shared: true });
    fireEvent.click(screen.getByText('Take the pin off'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('takes the pin from the first chosen photo that knows where it was', async () => {
    getPhoto.mockResolvedValueOnce({ photo: { id: 'a' } }).mockResolvedValueOnce({ photo: { id: 'b', latitude: 41.9, longitude: 12.5 } });
    const onChange = vi.fn();
    render(<MomentSpotField idPrefix='s' value={null} onChange={onChange} photos={[{ id: 'a' }, { id: 'b' }]} countryCode='IT' />);
    fireEvent.click(screen.getByText('Use a photo’s location'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ latitude: 41.9, longitude: 12.5, shared: false }));
  });

  it('says when none of the photos knows where it was', async () => {
    getPhoto.mockResolvedValue({ photo: { id: 'a' } });
    render(<MomentSpotField idPrefix='s' value={null} onChange={() => {}} photos={[{ id: 'a' }]} countryCode='IT' />);
    fireEvent.click(screen.getByText('Use a photo’s location'));
    expect(await screen.findByText('None of the moment’s photos says where it was taken. Tap the map instead.')).toBeTruthy();
  });

  describe('from the device', () => {
    afterEach(() => {
      delete navigator.geolocation;
    });

    it('pins where the device is', () => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition: (ok) => ok({ coords: { latitude: 51.5, longitude: -0.12 } }) },
      });
      const onChange = vi.fn();
      render(<MomentSpotField idPrefix='s' value={{ ...SPOT, shared: true }} onChange={onChange} countryCode='GB' />);
      fireEvent.click(screen.getByText('Use where I am now'));
      // The pin keeps its own choice of who sees it
      expect(onChange).toHaveBeenCalledWith({ latitude: 51.5, longitude: -0.12, shared: true });
    });

    it('says when the device wouldn’t share where it is', () => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition: (ok, fail) => fail({ code: 1, PERMISSION_DENIED: 1 }) },
      });
      render(<MomentSpotField idPrefix='s' value={null} onChange={() => {}} countryCode='GB' />);
      fireEvent.click(screen.getByText('Use where I am now'));
      expect(screen.getByText(/Your device didn’t share where it is/)).toBeTruthy();
    });

    it('says when the browser can’t tell', () => {
      Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
      render(<MomentSpotField idPrefix='s' value={null} onChange={() => {}} countryCode='GB' />);
      fireEvent.click(screen.getByText('Use where I am now'));
      expect(screen.getByText('This browser can’t say where it is. Tap the map instead.')).toBeTruthy();
    });
  });

  it('opens the map to tap, only once there is a country', { timeout: 20000 }, async () => {
    const { rerender } = render(<MomentSpotField idPrefix='s' value={null} onChange={() => {}} countryCode='' />);
    expect(screen.getByText('Tap the map').closest('button').disabled).toBe(true);
    rerender(<MomentSpotField idPrefix='s' value={null} onChange={() => {}} countryCode='FR' />);
    fireEvent.click(screen.getByText('Tap the map'));
    expect(await screen.findByText('Pin it in France', {}, { timeout: 10000 })).toBeTruthy();
  });
});

describe('MomentSpotPicker', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'DOMPoint',
      class {
        constructor(x, y) {
          this.x = x;
          this.y = y;
        }
        matrixTransform() {
          return { x: this.x, y: this.y };
        }
      },
    );
    SVGElement.prototype.getScreenCTM = () => ({ inverse: () => ({}) });
  });
  afterEach(() => {
    delete SVGElement.prototype.getScreenCTM;
  });

  it('puts the pin where the map is tapped, then hands it over', () => {
    const onPick = vi.fn();
    render(<MomentSpotPicker countryCode='FR' onPick={onPick} onClose={() => {}} />);
    expect(screen.getByText('No pin yet.')).toBeTruthy();
    expect(screen.getByText('Use this spot').closest('button').disabled).toBe(true);
    // The middle of the map, on the equator and the prime meridian
    fireEvent.click(document.querySelector('[data-world-map]'), { detail: 1, clientX: 987.1, clientY: 502 });
    expect(screen.getByText(/^The pin is at /)).toBeTruthy();
    fireEvent.click(screen.getByText('Use this spot'));
    const [spot] = onPick.mock.calls[0];
    expect(Math.abs(spot.latitude)).toBeLessThan(0.5);
    expect(Math.abs(spot.longitude)).toBeLessThan(0.5);
  });

  it('ignores a key pressed on a zoom stamp, and opens on a pin already set', () => {
    render(<MomentSpotPicker countryCode='FR' value={{ latitude: 48.8584, longitude: 2.2945 }} onPick={() => {}} onClose={() => {}} />);
    expect(screen.getByText('The pin is at 48.85840° N, 2.29450° E.')).toBeTruthy();
    fireEvent.click(screen.getByText('Zoom in'), { detail: 0 });
    expect(screen.getByText('The pin is at 48.85840° N, 2.29450° E.')).toBeTruthy();
  });

  it('cancels', () => {
    const onClose = vi.fn();
    render(<MomentSpotPicker countryCode='FR' onPick={() => {}} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('MomentForm', { timeout: 20000 }, () => {
  const form = (props = {}) => {
    const onSaved = vi.fn();
    const onCancel = vi.fn();
    const utils = render(<MomentForm mapId='m1' countryCode='FR' photoSource={{ mapId: 'm1', country: 'FR' }} onSaved={onSaved} onCancel={onCancel} {...props} />);
    return { onSaved, onCancel, form: utils.container.querySelector('form') };
  };

  it('has its fields, the country fixed when given', () => {
    const { form: el } = form({ trips: [{ id: 't1', title: 'Paris' }] });
    expect(el.hasAttribute('data-ticket-form')).toBe(true);
    expect(screen.getByLabelText('What kind').value).toBe('SAW_OR_DID');
    expect(screen.getByLabelText(/^Title/)).toBeTruthy();
    expect(screen.getByLabelText('The story')).toBeTruthy();
    expect(screen.getByLabelText('When').value).toBe('NONE');
    expect(screen.queryByLabelText(/^Country/)).toBeNull();
    expect(screen.getByLabelText('Landmark').disabled).toBe(true);
    expect(screen.getByLabelText('Town or place')).toBeTruthy();
    expect(screen.getByLabelText('Trip').value).toBe('');
    expect(screen.getByText('Pin it on the map')).toBeTruthy();
    // No travellers to choose from: no "Who it’s about"
    expect(screen.queryByText('Who it’s about')).toBeNull();
    expect(screen.getByText('Add moment')).toBeTruthy();
  });

  // 23 Nov 2026: a day on a trip (a safari day on a trip to Kenya)
  it('offers a day’s kinds first on a trip’s page, and the plain list elsewhere', async () => {
    createMoment.mockResolvedValue({ moment: { id: 'safari' } });
    const { unmount } = render(<MomentForm mapId='m1' defaultCountryCode='KE' tripId='trip-ke' photoSource={{ tripId: 'trip-ke' }} onSaved={() => {}} onCancel={() => {}} />);
    const kind = screen.getByLabelText('What kind');
    const groups = [...kind.querySelectorAll('optgroup')];
    expect(groups.map((g) => g.label)).toEqual(['A day on the trip', 'Life events']);
    expect(groups[0].querySelector('option').textContent).toBe('Safari');
    fireEvent.change(kind, { target: { value: 'SAFARI' } });
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Lions at dawn' } });
    fireEvent.click(screen.getByText('Add moment'));
    await waitFor(() => expect(createMoment).toHaveBeenCalled());
    expect(createMoment.mock.calls[0][1]).toMatchObject({ kind: 'SAFARI', title: 'Lions at dawn', countryCode: 'KE', tripId: 'trip-ke' });
    unmount();

    form();
    expect(screen.getByLabelText('What kind').querySelectorAll('optgroup')).toHaveLength(0);
  });

  it('asks for a title, then a country', async () => {
    form({ countryCode: null });
    fireEvent.click(screen.getByText('Add moment'));
    expect(await screen.findByText('Give the moment a title.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Up the tower' } });
    fireEvent.click(screen.getByText('Add moment'));
    expect(await screen.findByText('Choose the country it happened in.')).toBeTruthy();
    expect(createMoment).not.toHaveBeenCalled();
  });

  it('says what’s missing from the date', async () => {
    form();
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Up the tower' } });
    fireEvent.change(screen.getByLabelText('When'), { target: { value: 'DAY' } });
    fireEvent.click(screen.getByText('Add moment'));
    expect(await screen.findByText('Choose the day, or say less about the date.')).toBeTruthy();
  });

  it('adds a new moment with what was filled in', async () => {
    const saved = { id: 'new' };
    createMoment.mockResolvedValue({ moment: saved });
    useLandmarks.mockReturnValue({ landmarks: [{ id: 'eiffel', name: 'Eiffel Tower' }] });
    const { onSaved } = form({ travellers: [{ id: 'tr1', name: 'Charlie' }], tripId: 'trip9' });
    fireEvent.change(screen.getByLabelText('What kind'), { target: { value: 'ENGAGEMENT' } });
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Engaged' } });
    fireEvent.change(screen.getByLabelText('The story'), { target: { value: '  ' } });
    fireEvent.change(screen.getByLabelText('When'), { target: { value: 'YEAR' } });
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2019' } });
    fireEvent.change(screen.getByLabelText('Landmark'), { target: { value: 'eiffel' } });
    fireEvent.change(screen.getByLabelText('Town or place'), { target: { value: ' Paris ' } });
    fireEvent.click(screen.getByText('Charlie'));
    fireEvent.click(screen.getByLabelText('Hide from viewers (only you and the editors see it)'));
    fireEvent.click(screen.getByText('Add moment'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
    expect(createMoment).toHaveBeenCalledWith('m1', {
      kind: 'ENGAGEMENT',
      title: 'Engaged',
      text: null,
      happenedOn: '2019-01-01',
      datePrecision: 'YEAR',
      countryCode: 'FR',
      landmarkId: 'eiffel',
      placeName: 'Paris',
      spot: null,
      hidden: true,
      travellerIds: ['tr1'],
      photoIds: [],
      tripId: 'trip9',
    });
  });

  it('saves changes to a moment, keeping its trip unless the trips are given', async () => {
    updateMoment.mockResolvedValue({ moment: { id: 'mo1' } });
    const moment = { id: 'mo1', kind: 'WEDDING', title: 'Wed', countryCode: 'IT', travellerIds: [], photos: [], tripId: 't1', happenedOn: null };
    form({ moment, countryCode: 'IT', tripId: 't1' });
    expect(screen.getByLabelText(/^Title/).value).toBe('Wed');
    fireEvent.click(screen.getByText('Save moment'));
    await waitFor(() => expect(updateMoment).toHaveBeenCalled());
    expect(updateMoment.mock.calls[0][0]).toBe('mo1');
    expect('tripId' in updateMoment.mock.calls[0][1]).toBe(false);
  });

  it('offers to mark a new moment’s country with no status, Lived for a birth', async () => {
    createMoment.mockResolvedValue({ moment: { id: 'new' } });
    const onMarkVisit = vi.fn().mockResolvedValue();
    const { onSaved } = form({ visitStatus: null, onMarkVisit });
    expect(screen.getByLabelText('Mark France as visited on the map').checked).toBe(true);
    fireEvent.change(screen.getByLabelText('What kind'), { target: { value: 'BORN' } });
    expect(screen.getByLabelText('Mark France as lived there on the map')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Born' } });
    fireEvent.click(screen.getByText('Add moment'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onMarkVisit).toHaveBeenCalledWith('LIVED');
  });

  it('never offers to mark a country that has a status', () => {
    form({ visitStatus: 'VISITED', onMarkVisit: vi.fn() });
    expect(screen.queryByText(/^Mark France/)).toBeNull();
  });

  it('offers to add a new baby as a traveller, asking their name', async () => {
    createMoment.mockResolvedValue({ moment: { id: 'new' } });
    const onAddTraveller = vi.fn().mockResolvedValue({ id: 'baby1' });
    const { onSaved } = form({ onAddTraveller });
    fireEvent.change(screen.getByLabelText('What kind'), { target: { value: 'BORN' } });
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Mia arrives' } });
    fireEvent.click(screen.getByLabelText('Add the baby to this map as a traveller, born in France'));
    fireEvent.click(screen.getByText('Add moment'));
    expect(await screen.findByText('Give the baby’s name, to add them to the map.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^Their name/), { target: { value: 'Mia' } });
    fireEvent.click(screen.getByText('Add moment'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onAddTraveller).toHaveBeenCalledWith({ name: 'Mia', birthCountryCode: 'FR' });
    expect(createMoment.mock.calls[0][1].travellerIds).toEqual(['baby1']);
  });

  // 23 Nov 2026: a birth dated to the day is the baby's date of birth
  it('gives the new baby the birth’s day as their date of birth', async () => {
    createMoment.mockResolvedValue({ moment: { id: 'new' } });
    const onAddTraveller = vi.fn().mockResolvedValue({ id: 'baby1' });
    const { onSaved } = form({ onAddTraveller });
    fireEvent.change(screen.getByLabelText('What kind'), { target: { value: 'BORN' } });
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Mia arrives' } });
    fireEvent.change(screen.getByLabelText('When'), { target: { value: 'DAY' } });
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '2026-11-01' } });
    fireEvent.click(screen.getByLabelText('Add the baby to this map as a traveller, born in France'));
    fireEvent.change(screen.getByLabelText(/^Their name/), { target: { value: 'Mia' } });
    fireEvent.click(screen.getByText('Add moment'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onAddTraveller).toHaveBeenCalledWith({ name: 'Mia', birthCountryCode: 'FR', birthDate: '2026-11-01' });
  });

  it('says why a save failed, and adds the baby only once on a retry', async () => {
    createMoment.mockRejectedValueOnce(Object.assign(new Error('x'), { friendlyMessage: 'The spot isn’t in France.' }));
    createMoment.mockResolvedValueOnce({ moment: { id: 'new' } });
    const onAddTraveller = vi.fn().mockResolvedValue({ id: 'baby1' });
    form({ onAddTraveller });
    fireEvent.change(screen.getByLabelText('What kind'), { target: { value: 'BORN' } });
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Mia arrives' } });
    fireEvent.click(screen.getByLabelText('Add the baby to this map as a traveller, born in France'));
    fireEvent.change(screen.getByLabelText(/^Their name/), { target: { value: 'Mia' } });
    fireEvent.click(screen.getByText('Add moment'));
    expect(await screen.findByText('The spot isn’t in France.')).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText('Add moment')));
    await waitFor(() => expect(createMoment).toHaveBeenCalledTimes(2));
    expect(onAddTraveller).toHaveBeenCalledTimes(1);
    expect(createMoment.mock.calls[1][1].travellerIds).toEqual(['baby1']);
  });

  it('asks for the country when it isn’t fixed, starting from the default', () => {
    form({ countryCode: null, defaultCountryCode: 'IT' });
    const country = screen.getByLabelText(/^Country/);
    expect(country.value).toBe('IT');
    expect(country.querySelectorAll('option').length).toBeGreaterThan(200);
  });

  it('cancels', () => {
    const { onCancel } = form();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
