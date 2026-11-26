// A traveller's passport photo and signature (components/passport/; 25 Nov 2026, the user's
// wish: "improve passport page for user avatars and info")
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TravellerPhotoDialog from '@/components/passport/TravellerPhotoDialog';
import TravellerSignatureDialog from '@/components/passport/TravellerSignatureDialog';
import { updateTravellerPassport } from '@/api/travelApi';
import usePhotoPage from '@/hooks/usePhotoPage';

vi.mock('@/api/travelApi', () => ({ updateTravellerPassport: vi.fn() }));
vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));

const PHOTOS = [
  { id: 'p-rome', caption: 'First morning in Rome', thumbUrl: '/rome-t.jpg', displayUrl: '/rome-d.jpg' },
  { id: 'p-hidden', caption: 'Hidden one', thumbUrl: '/h.jpg', hidden: true },
  { id: 'v-1', kind: 'VIDEO', caption: 'A video', thumbUrl: '/v.jpg' },
];
const CHARLIE = { id: 'trav-test', name: 'Charlie', photo: null, signature: null };
const SAVED = { ...CHARLIE, photo: { source: 'MAP', photoId: 'p-rome', url: '/rome-d.jpg', focusX: 0.5, focusY: 0.5, zoom: 1 } };

// jsdom has no PointerEvent, so fireEvent would send a plain Event without the position
class FakePointerEvent extends MouseEvent {
  constructor(type, init = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 0;
    this.pointerType = init.pointerType ?? 'mouse';
  }
}

let more;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('PointerEvent', FakePointerEvent);
  more = vi.fn();
  usePhotoPage.mockReturnValue({ photos: PHOTOS, loading: false, error: null, nextCursor: 'c', loadMore: more });
  updateTravellerPassport.mockResolvedValue({ traveller: SAVED });
});

const button = (text) => screen.getByText(text).closest('button');

describe('TravellerPhotoDialog', () => {
  const open = (traveller = CHARLIE) => {
    const handlers = { onSaved: vi.fn(), onClose: vi.fn() };
    render(<TravellerPhotoDialog mapId='map-1' traveller={traveller} {...handlers} />);
    return handlers;
  };

  it('offers the map’s photos, never a video or a hidden one', () => {
    open();
    expect(document.querySelector('[role="dialog"]').textContent).toContain('Charlie’s passport photo');
    expect(usePhotoPage).toHaveBeenCalledWith({ mapId: 'map-1', display: true, limit: 60 });
    expect([...document.querySelectorAll('[data-portrait-choice]')].map((b) => b.getAttribute('data-portrait-choice'))).toEqual(['p-rome']);
    fireEvent.click(screen.getByText('Show more photos'));
    expect(more).toHaveBeenCalled();
  });

  it('places the chosen photo in the box by drag, the arrow keys and zoom, then saves it', async () => {
    const { onSaved, onClose } = open();
    fireEvent.click(screen.getByText('First morning in Rome').closest('button'));
    const cropper = document.querySelector('[data-portrait-cropper]');
    expect(cropper.querySelector('img').getAttribute('src')).toBe('/rome-d.jpg');
    fireEvent.change(screen.getByLabelText('Zoom'), { target: { value: '2' } });
    fireEvent.keyDown(cropper, { key: 'ArrowLeft' });
    fireEvent.keyDown(cropper, { key: 'ArrowUp' });
    expect(cropper.querySelector('img').style.transform).toBe('scale(2)');
    fireEvent.click(button('Save the photo'));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(SAVED));
    expect(updateTravellerPassport).toHaveBeenCalledWith('map-1', 'trav-test', { photo: { photoId: 'p-rome', focusX: 0.51, focusY: 0.51, zoom: 2 } });
    expect(onClose).toHaveBeenCalled();
  });

  it('moves the photo with a drag, as it follows the pointer', () => {
    open();
    fireEvent.click(screen.getByText('First morning in Rome').closest('button'));
    const cropper = document.querySelector('[data-portrait-cropper]');
    Object.defineProperty(cropper, 'clientWidth', { value: 100 });
    Object.defineProperty(cropper, 'clientHeight', { value: 100 });
    fireEvent.pointerDown(cropper, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(cropper, { clientX: 70, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(cropper, { pointerId: 1 });
    expect(cropper.querySelector('img').style.objectPosition).toBe('30% 50%');
  });

  it('opens on the photo chosen before, which can be taken off', async () => {
    const { onSaved } = open(SAVED);
    expect(document.querySelector('[data-portrait-cropper]')).toBeTruthy();
    fireEvent.click(button('Take the photo off'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(updateTravellerPassport).toHaveBeenCalledWith('map-1', 'trav-test', { photo: null });
  });

  it('says why it couldn’t be saved, and stays open', async () => {
    updateTravellerPassport.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Verify your email first.' }));
    const { onClose } = open(SAVED);
    fireEvent.click(button('Save the photo'));
    expect(await screen.findByText('Verify your email first.')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('TravellerSignatureDialog', () => {
  const open = (traveller = CHARLIE) => {
    const handlers = { onSaved: vi.fn(), onClose: vi.fn() };
    render(<TravellerSignatureDialog mapId='map-1' traveller={traveller} {...handlers} />);
    const pad = document.querySelector('[data-signature-pad]');
    pad.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 100, right: 300, bottom: 100 });
    return { ...handlers, pad };
  };

  it('draws strokes with the pointer and saves them as a path', async () => {
    const { pad, onSaved } = open();
    expect(button('Save the signature').disabled).toBe(true);
    fireEvent.pointerDown(pad, { clientX: 10, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(pad, { clientX: 40, clientY: 30, pointerId: 1 });
    fireEvent.pointerMove(pad, { clientX: 70, clientY: 60, pointerId: 1 });
    fireEvent.pointerUp(pad, { pointerId: 1 });
    // Moving without the button down draws nothing
    fireEvent.pointerMove(pad, { clientX: 200, clientY: 10, pointerId: 1 });
    expect(pad.querySelector('path').getAttribute('d')).toBe('M10 50L40 30L70 60');
    fireEvent.click(button('Save the signature'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(updateTravellerPassport).toHaveBeenCalledWith('map-1', 'trav-test', { signature: 'M10 50L40 30L70 60' });
  });

  it('starts again, and goes back to the name in handwriting', async () => {
    const { pad, onSaved } = open({ ...CHARLIE, signature: 'M1 1L50 50' });
    fireEvent.pointerDown(pad, { clientX: 10, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(pad, { pointerId: 1 });
    expect(pad.querySelector('path')).toBeTruthy();
    fireEvent.click(button('Start again'));
    expect(pad.querySelector('path')).toBeNull();
    // The signature there now, for comparison
    expect(screen.getByRole('img', { name: 'Charlie’s signature' })).toBeTruthy();
    fireEvent.click(button('Use the name instead'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(updateTravellerPassport).toHaveBeenCalledWith('map-1', 'trav-test', { signature: null });
  });

  it('has nothing to take off without a signature', () => {
    open();
    expect(button('Use the name instead').disabled).toBe(true);
  });
});
