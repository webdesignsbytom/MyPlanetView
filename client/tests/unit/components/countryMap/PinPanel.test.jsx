import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PinPanel from '@/components/countryMap/PinPanel';
import PinVisitForm, { VISIT_PHOTOS_MAX } from '@/components/countryMap/PinVisitForm';
import { addPinVisit, createPin, deletePin, deletePinVisit, getPin, updatePin, updatePinVisit } from '@/api/travelApi';
import usePhotoPage from '@/hooks/usePhotoPage';

vi.mock('@/api/travelApi', () => ({
  addPinVisit: vi.fn(),
  createPin: vi.fn(),
  deletePin: vi.fn(),
  deletePinVisit: vi.fn(),
  getPin: vi.fn(),
  updatePin: vi.fn(),
  updatePinVisit: vi.fn(),
}));
vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));
vi.mock('@/components/map/MapPanel', () => ({
  default: ({ title, children }) => (
    <section data-map-panel={title}>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));
vi.mock('@/components/photos/PhotoUploader', () => ({
  default: ({ defaultCountryCode, onUploaded }) => (
    <div data-uploader={defaultCountryCode}>
      <button type='button' onClick={() => onUploaded({ id: 'up1', thumbUrl: '/up1.jpg' })}>
        Finish an upload
      </button>
    </div>
  ),
}));

const PIN = {
  id: 'pin1',
  name: 'Our café',
  notes: 'Best croissants.',
  countryCode: 'FR',
  hidden: true,
  visits: [
    { id: 'v2', visitedOn: '2024-05-01', datePrecision: 'DAY', notes: 'Again!', photos: [{ id: 'ph1', thumbUrl: '/1.jpg' }] },
    { id: 'v1', visitedOn: '2019-01-01', datePrecision: 'YEAR', notes: null, photos: [] },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  usePhotoPage.mockReturnValue({ photos: [], loading: false, error: null, nextCursor: null, loadMore: vi.fn() });
  getPin.mockResolvedValue({ pin: PIN });
});

describe('PinVisitForm', () => {
  it('saves when, a note and the photos chosen', async () => {
    const onSave = vi.fn().mockResolvedValue();
    render(<PinVisitForm countryCode='FR' photoSource={{ mapId: 'm1' }} onSave={onSave} onCancel={() => {}} />);
    expect(document.querySelector('[data-pin-visit-form]')).toBeTruthy();
    expect(screen.getByText('0 of 50 chosen')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('When'), { target: { value: 'YEAR' } });
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2021' } });
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: ' Rainy ' } });
    fireEvent.click(screen.getByText('Save the visit'));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ visitedOn: '2021-01-01', datePrecision: 'YEAR', notes: 'Rainy', photoIds: [] }));
  });

  it('offers the country’s photos first, or the whole map’s', () => {
    render(<PinVisitForm countryCode='FR' photoSource={{ mapId: 'm1' }} onSave={() => {}} />);
    fireEvent.click(screen.getByText('Choose photos'));
    expect(usePhotoPage).toHaveBeenLastCalledWith({ mapId: 'm1', country: 'FR', enabled: true });
    fireEvent.click(screen.getByLabelText('Show photos from anywhere on the map'));
    expect(usePhotoPage).toHaveBeenLastCalledWith({ mapId: 'm1', enabled: true });
  });

  it('says what’s missing from the date, and why a save failed', async () => {
    const onSave = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Too many visits.' }));
    render(<PinVisitForm countryCode='FR' photoSource={{}} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('When'), { target: { value: 'DAY' } });
    fireEvent.click(screen.getByText('Save the visit'));
    expect((await screen.findByText('Choose the day, or say less about the date.')).getAttribute('role')).toBe('alert');
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('When'), { target: { value: 'NONE' } });
    fireEvent.click(screen.getByText('Save the visit'));
    expect(await screen.findByText('Too many visits.')).toBeTruthy();
  });

  it('starts from the visit being changed', () => {
    render(<PinVisitForm visit={PIN.visits[0]} countryCode='FR' photoSource={{}} onSave={() => {}} />);
    expect(screen.getByLabelText('When').value).toBe('DAY');
    expect(screen.getByLabelText('Day').value).toBe('2024-05-01');
    expect(screen.getByLabelText('Notes').value).toBe('Again!');
    expect(screen.getByText('1 of 50 chosen')).toBeTruthy();
  });

  it('adds each photo uploaded here to the visit', async () => {
    const onSave = vi.fn().mockResolvedValue();
    const onUploaded = vi.fn();
    render(<PinVisitForm countryCode='FR' photoSource={{}} uploader={{ mapId: 'm1', onUploaded }} onSave={onSave} />);
    fireEvent.click(screen.getByText('Upload new photos for this visit'));
    expect(document.querySelector('[data-uploader="FR"]')).toBeTruthy();
    fireEvent.click(screen.getByText('Finish an upload'));
    fireEvent.click(screen.getByText('Finish an upload'));
    expect(onUploaded).toHaveBeenCalledTimes(2);
    expect(screen.getByText('1 of 50 chosen')).toBeTruthy();
    fireEvent.click(screen.getByText('Save the visit'));
    await waitFor(() => expect(onSave.mock.calls[0][0].photoIds).toEqual(['up1']));
    expect(VISIT_PHOTOS_MAX).toBe(50);
  });
});

describe('PinPanel', () => {
  const panel = (props = {}) => {
    const handlers = { onChanged: vi.fn(), onDeleted: vi.fn(), onCreated: vi.fn(), onClose: vi.fn(), onOpenPhoto: vi.fn() };
    render(<PinPanel pinId='pin1' source={{ mapId: 'm1' }} mapId='m1' {...handlers} {...props} />);
    return handlers;
  };

  it('loads the pin, its visits newest first', async () => {
    panel();
    expect(screen.getByText('Loading the pin…')).toBeTruthy();
    expect(await screen.findByText('France · 2 visits · only the map’s editors see it')).toBeTruthy();
    expect(getPin).toHaveBeenCalledWith({ mapId: 'm1' }, 'pin1');
    expect(document.querySelector('[data-map-panel]').getAttribute('data-map-panel')).toBe('Our café');
    expect(screen.getByText('Best croissants.')).toBeTruthy();
    const visits = [...document.querySelectorAll('[data-pin-visit]')];
    expect(visits.map((v) => v.getAttribute('aria-label'))).toEqual(['Visit 2 of 2: 1 May 2024', 'Visit 1 of 2: 2019']);
    expect(screen.getByText('No photos from this visit yet.')).toBeTruthy();
    expect(screen.queryByText('Change the pin')).toBeNull();
  });

  it('says why a pin couldn’t be loaded', async () => {
    getPin.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'This pin isn’t there.' }));
    panel();
    expect(await screen.findByText('This pin isn’t there.')).toBeTruthy();
  });

  it('opens a visit’s photo over the visit’s photos', async () => {
    const { onOpenPhoto } = panel();
    fireEvent.click(await screen.findByText('Photo 1 of 1 from 1 May 2024'));
    expect(onOpenPhoto).toHaveBeenCalledWith(PIN.visits[0].photos[0], { photos: PIN.visits[0].photos });
  });

  it('lets an editor change the pin, shared or not', async () => {
    updatePin.mockResolvedValue({ pin: { ...PIN, name: 'The café', hidden: false } });
    const { onChanged } = panel({ canEdit: true });
    fireEvent.click(await screen.findByText('Change the pin'));
    expect(screen.getByLabelText('Show this pin to everyone the map is shared with').checked).toBe(false);
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: ' The café ' } });
    fireEvent.click(screen.getByLabelText('Show this pin to everyone the map is shared with'));
    fireEvent.click(screen.getByText('Save the pin'));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(updatePin).toHaveBeenCalledWith('pin1', { name: 'The café', notes: 'Best croissants.', hidden: false });
    expect(screen.getByText('France · 2 visits · shared')).toBeTruthy();
  });

  it('asks for a name', async () => {
    panel({ canEdit: true });
    fireEvent.click(await screen.findByText('Change the pin'));
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: '  ' } });
    fireEvent.click(screen.getByText('Save the pin'));
    expect(screen.getByText('Give the pin a name, like "Our spot in Crete".')).toBeTruthy();
    expect(updatePin).not.toHaveBeenCalled();
  });

  it('deletes the pin only after asking', async () => {
    deletePin.mockResolvedValue({});
    const { onDeleted } = panel({ canEdit: true });
    fireEvent.click(await screen.findByText('Delete the pin'));
    fireEvent.click(screen.getByText('Keep it'));
    fireEvent.click(screen.getByText('Delete the pin'));
    fireEvent.click(screen.getByText('Delete the pin and its visits'));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(deletePin).toHaveBeenCalledWith('pin1');
  });

  it('adds, changes and deletes visits', async () => {
    addPinVisit.mockResolvedValue({ pin: PIN });
    updatePinVisit.mockResolvedValue({ pin: PIN });
    deletePinVisit.mockResolvedValue({ pin: { ...PIN, visits: [PIN.visits[0]] } });
    panel({ canEdit: true });
    fireEvent.click(await screen.findByText('Add a visit'));
    fireEvent.click(screen.getByText('Add the visit'));
    await waitFor(() => expect(addPinVisit).toHaveBeenCalledWith('pin1', { visitedOn: null, datePrecision: null, notes: null, photoIds: [] }));
    fireEvent.click(screen.getAllByText('Change this visit')[1]);
    fireEvent.click(screen.getByText('Save the visit'));
    await waitFor(() => expect(updatePinVisit).toHaveBeenCalledWith('pin1', 'v1', expect.objectContaining({ datePrecision: 'YEAR' })));
    fireEvent.click(screen.getAllByText('Delete this visit')[1]);
    fireEvent.click(screen.getByText('Delete it for good'));
    await waitFor(() => expect(deletePinVisit).toHaveBeenCalledWith('pin1', 'v1'));
    expect(screen.getByText('France · 1 visit · only the map’s editors see it')).toBeTruthy();
  });

  it('shows an unverified editor the pin, saying why it can’t be changed', async () => {
    panel({ canEdit: true, locked: true });
    expect(await screen.findByText(/Verify your email address to change pins/)).toBeTruthy();
    expect(screen.queryByText('Change the pin')).toBeNull();
    expect(screen.queryByText('Add a visit')).toBeNull();
  });

  it('says when there are no visits, inviting an editor to add one', async () => {
    getPin.mockResolvedValue({ pin: { ...PIN, visits: [] } });
    panel({ canEdit: true });
    expect(await screen.findByText('No visits yet. Add one for every time you go.')).toBeTruthy();
  });

  describe('a new pin', () => {
    const DRAFT = { latitude: 48.85, longitude: 2.35, countryCode: 'FR' };

    it('asks its name and sharing, then its first visit, and saves them together', async () => {
      const pin = { ...PIN, id: 'new' };
      createPin.mockResolvedValue({ pin });
      const { onCreated } = panel({ pinId: null, draft: DRAFT, canEdit: true });
      expect(document.querySelector('[data-map-panel]').getAttribute('data-map-panel')).toBe('New pin in France');
      expect(getPin).not.toHaveBeenCalled();
      // Off to start with, as a moment’s spot
      expect(screen.getByLabelText('Show this pin to everyone the map is shared with').checked).toBe(false);
      fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Our café' } });
      fireEvent.click(screen.getByText('Next: the first visit'));
      expect(screen.getByText('Our café: the first visit')).toBeTruthy();
      fireEvent.click(screen.getByText('Save the pin'));
      await waitFor(() => expect(onCreated).toHaveBeenCalledWith(pin));
      expect(createPin).toHaveBeenCalledWith('m1', {
        name: 'Our café',
        notes: null,
        hidden: true,
        latitude: 48.85,
        longitude: 2.35,
        countryCode: 'FR',
        visit: { visitedOn: null, datePrecision: null, notes: null, photoIds: [] },
      });
    });

    it('goes back to the details, keeping them', () => {
      panel({ pinId: null, draft: DRAFT, canEdit: true });
      fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Our café' } });
      fireEvent.click(screen.getByText('Next: the first visit'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.getByLabelText(/^Name/).value).toBe('Our café');
    });

    it('says an unverified editor must verify first', () => {
      panel({ pinId: null, draft: DRAFT, canEdit: true, locked: true });
      expect(screen.getByText(/Verify your email address to add pins/)).toBeTruthy();
    });
  });
});
