// "Send a postcard" (components/postcards/: SendPostcard, PostcardMakerDialog, PostcardPictureFields,
// PostcardStylePicker; 26 Nov 2026, the user's wish; docs/API.md "Postcards"): a photo across the
// front, a city's or the wilderness's on every plan, a landmark's or your own on a paid one
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PostcardMakerDialog from '@/components/postcards/PostcardMakerDialog';
import SendPostcard from '@/components/postcards/SendPostcard';
import { getMyPostcards, sendPostcard } from '@/api/postcardsApi';
import usePhotoPage from '@/hooks/usePhotoPage';
import useLandmarks from '@/hooks/useLandmarks';
import { photoAsBlob, uploadPostcardPicture } from '@/utils/postcards/uploadPostcardPicture';

vi.mock('@/api/postcardsApi', () => ({ getMyPostcards: vi.fn(), sendPostcard: vi.fn() }));
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Charlie Reid' } }) }));
vi.mock('@/hooks/useLandmarkPhotos', () => ({ default: () => null }));
vi.mock('@/hooks/useLandmarks', () => ({ default: vi.fn() }));
// The place's landmarks: a city's, the wilderness's and a landmark's photo (postcardPhotos.js), and one with none
const FRANCE = [
  { id: 'lm-eiffel', name: 'Eiffel Tower', slug: 'eiffel-tower', wikidataId: 'Q243', countryCode: 'FR' },
  { id: 'lm-seine', name: 'Paris, Banks of the Seine', slug: 'paris-banks-of-the-seine', wikidataId: 'Q2233532', countryCode: 'FR' },
  { id: 'lm-porto', name: 'Gulf of Porto', slug: 'gulf-of-porto', wikidataId: 'Q15728421', countryCode: 'FR' },
  { id: 'lm-none', name: 'A place with no picture', slug: 'no-picture', wikidataId: 'Q0', countryCode: 'FR' },
];
vi.mock('@/hooks/usePhotoPage', () => ({ default: vi.fn() }));
vi.mock('@/utils/postcards/uploadPostcardPicture', async (importOriginal) => ({
  ...(await importOriginal()),
  uploadPostcardPicture: vi.fn(),
  photoAsBlob: vi.fn(),
}));
// The card itself is drawn on a canvas, which jsdom hasn't: shown as its words here
vi.mock('@/components/postcards/PostcardView', () => ({
  default: ({ card, side }) => (
    <div data-postcard-preview={card.kind} data-side={side ?? 'front'}>
      {card.message} {card.landmark?.name} {card.pictureUrl} {card.style}
    </div>
  ),
}));

const MADE = { id: 'pc-1', code: 'ABCD-EFGH-JKMN', kind: 'COUNTRY', countryCode: 'FR', toName: 'Gran', message: 'Hi', sentAt: '2026-11-26T10:00:00.000Z' };
beforeEach(() => {
  vi.clearAllMocks();
  useLandmarks.mockReturnValue({ landmarks: FRANCE });
  getMyPostcards.mockResolvedValue({ postcards: [], paidCards: true });
  sendPostcard.mockResolvedValue({ postcard: MADE });
  usePhotoPage.mockReturnValue({ photos: [{ id: 'p-1', thumbUrl: '/t.jpg', displayUrl: '/d.jpg', caption: 'Seine' }, { id: 'v-1', kind: 'VIDEO', thumbUrl: '/v.jpg' }] });
  photoAsBlob.mockResolvedValue(new Blob(['img']));
  uploadPostcardPicture.mockResolvedValue({ key: 'myplanetview/postcards/u/card-a.webp', previewUrl: 'blob:own' });
});

const open = async (props = {}) => {
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <PostcardMakerDialog countryCode='FR' placeName='France' photoFilters={{ mapId: 'm1', country: 'FR', display: true }} onClose={onClose} {...props} />
    </MemoryRouter>,
  );
  await waitFor(() => expect(getMyPostcards).toHaveBeenCalled());
  return { onClose };
};
const tab = (value) => document.querySelector(`[data-postcard-tab="${value}"]`);
const pick = (slug) => document.querySelector(`[data-postcard-pick="${slug}"]`);
const preview = () => document.querySelector('[data-postcard-preview]');
const sendButton = () => screen.getByText('Send the postcard').closest('button');
const write = (value) => fireEvent.change(screen.getByLabelText('Your message'), { target: { value } });

describe('PostcardMakerDialog', () => {
  it('starts with the place’s first city photo, the classic style and the sender’s first name, and previews it', async () => {
    await open();
    expect(document.querySelector('[role="dialog"]').textContent).toContain('Send a postcard from France');
    // Its tabs, each with its count: no tab for a group the place has none of
    expect([...document.querySelectorAll('[data-postcard-tab]')].map((t) => t.textContent)).toEqual(['City(1)', 'Wilderness(1)', 'Landmarks(1)', 'Your photo']);
    expect(tab('c').getAttribute('aria-pressed')).toBe('true');
    expect(pick('paris-banks-of-the-seine').getAttribute('aria-pressed')).toBe('true');
    expect(pick('no-picture')).toBeNull();
    expect(document.querySelector('[data-postcard-style="classic"] input').checked).toBe(true);
    expect(screen.getByLabelText('From').value).toBe('Charlie');
    expect(preview().getAttribute('data-postcard-preview')).toBe('COUNTRY');
    expect(preview().textContent).toContain('Paris, Banks of the Seine');
    expect(preview().textContent).toContain('Your message goes here.');
    expect(screen.getByText('0 of 400 characters')).toBeTruthy();
    // No scroll anchoring: on a phone it scrolled back to the focused message after the dialog
    // was scrolled to the card, so "Turn it over" was pressed in the message (postcards.spec.js)
    expect(document.querySelector('form[aria-label="New postcard"]').className).toContain('[overflow-anchor:none]');
  });

  it('sends a country’s card with its city photo, in the style chosen, then shows its link', async () => {
    const { onClose } = await open();
    fireEvent.click(document.querySelector('[data-postcard-style="night"] input'));
    write('Bonjour!');
    // Writing turns the preview over
    expect(preview().getAttribute('data-side')).toBe('back');
    fireEvent.change(screen.getByLabelText('To'), { target: { value: ' Gran ' } });
    await act(async () => fireEvent.click(sendButton()));
    expect(sendPostcard).toHaveBeenCalledWith({
      kind: 'COUNTRY',
      countryCode: 'FR',
      landmarkId: 'lm-seine',
      pictureKey: undefined,
      style: 'night',
      message: 'Bonjour!',
      toName: 'Gran',
      fromName: 'Charlie',
    });
    expect(document.querySelector('[data-postcard-made="ABCD-EFGH-JKMN"]')).not.toBeNull();
    expect(screen.getByLabelText('Link to your postcard to Gran').value).toContain('/postcard/ABCD-EFGH-JKMN');
    fireEvent.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalled();
  });

  it('asks for a message, and says what the server refused', async () => {
    await open();
    await act(async () => fireEvent.click(sendButton()));
    expect(screen.getByText('Write a message on the back of your postcard.')).toBeTruthy();
    expect(sendPostcard).not.toHaveBeenCalled();
    sendPostcard.mockRejectedValueOnce({ friendlyMessage: 'Postcards of landmarks… come with Business' });
    write('Hi');
    await act(async () => fireEvent.click(sendButton()));
    expect(screen.getByText('Postcards of landmarks… come with Business')).toBeTruthy();
  });

  it('puts a wilderness photo on a country’s card, and a landmark’s on a landmark’s card', async () => {
    await open();
    fireEvent.click(tab('w'));
    expect(tab('w').getAttribute('aria-pressed')).toBe('true');
    expect(pick('paris-banks-of-the-seine')).toBeNull();
    fireEvent.click(pick('gulf-of-porto'));
    await waitFor(() => expect(preview().textContent).toContain('Gulf of Porto'));
    write('By the sea');
    await act(async () => fireEvent.click(sendButton()));
    expect(sendPostcard).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'COUNTRY', landmarkId: 'lm-porto' }));

    fireEvent.click(screen.getByText('Send another'));
    fireEvent.click(tab('l'));
    fireEvent.click(pick('eiffel-tower'));
    await waitFor(() => expect(preview().getAttribute('data-postcard-preview')).toBe('LANDMARK'));
    expect(preview().textContent).toContain('Eiffel Tower');
    write('Up the tower');
    await act(async () => fireEvent.click(sendButton()));
    expect(sendPostcard).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'LANDMARK', landmarkId: 'lm-eiffel', pictureKey: undefined }));
  });

  it('sends a card from one of the place’s photos, or one from the device', async () => {
    await open();
    fireEvent.click(tab('own'));
    expect(usePhotoPage).toHaveBeenCalledWith({ mapId: 'm1', country: 'FR', display: true });
    // Photos only, never a video
    expect(document.querySelector('[data-postcard-photo="v-1"]')).toBeNull();
    await act(async () => fireEvent.click(document.querySelector('[data-postcard-photo="p-1"]')));
    expect(photoAsBlob).toHaveBeenCalledWith('/d.jpg');
    expect(uploadPostcardPicture).toHaveBeenCalled();
    expect(document.querySelector('[data-postcard-own-photo]').getAttribute('src')).toBe('blob:own');
    expect(document.querySelector('[data-postcard-photo="p-1"]').getAttribute('aria-pressed')).toBe('true');
    expect(preview().getAttribute('data-postcard-preview')).toBe('PHOTO');

    const file = new File(['x'], 'mine.jpg', { type: 'image/jpeg' });
    await act(async () => fireEvent.change(document.querySelector('[data-postcard-file]'), { target: { files: [file] } }));
    expect(uploadPostcardPicture).toHaveBeenLastCalledWith(file, expect.any(Function));
    write('Our photo');
    await act(async () => fireEvent.click(sendButton()));
    expect(sendPostcard).toHaveBeenCalledWith(expect.objectContaining({ kind: 'PHOTO', landmarkId: undefined, pictureKey: 'myplanetview/postcards/u/card-a.webp' }));
  });

  it('turns away a HEIC file and says why an upload failed', async () => {
    await open();
    fireEvent.click(tab('own'));
    await act(async () => fireEvent.change(document.querySelector('[data-postcard-file]'), { target: { files: [new File(['x'], 'IMG.HEIC')] } }));
    expect(screen.getByText('That photo is an iPhone HEIC file. Please save it as a JPEG first.')).toBeTruthy();
    uploadPostcardPicture.mockRejectedValueOnce(new Error('That photo is too detailed to use. Please choose another.'));
    await act(async () => fireEvent.click(document.querySelector('[data-postcard-photo="p-1"]')));
    expect(screen.getByText('That photo is too detailed to use. Please choose another.')).toBeTruthy();
  });

  it('locks the landmarks’ photos and your own on a plan without them, saying which plans have them', async () => {
    getMyPostcards.mockResolvedValue({ postcards: [], paidCards: false });
    await open();
    // A city's and the wilderness's stay free
    expect(tab('c').querySelector('svg')).toBeNull();
    expect(tab('w').querySelector('svg')).toBeNull();
    expect(tab('l').querySelector('svg')).not.toBeNull();
    expect(tab('own').querySelector('svg')).not.toBeNull();
    expect(pick('paris-banks-of-the-seine').disabled).toBe(false);
    expect(document.querySelector('[data-postcard-locked]')).toBeNull();

    fireEvent.click(tab('l'));
    expect(pick('eiffel-tower').disabled).toBe(true);
    expect(pick('eiffel-tower').textContent).toContain('(with Business and First Class)');
    expect(document.querySelector('[data-postcard-locked]').textContent).toContain('Postcards of landmarks and of your own photos come with Business and First Class.');
    expect(screen.getByText('See the plans').getAttribute('href')).toBe('/pricing');

    fireEvent.click(tab('own'));
    expect(document.querySelector('[data-postcard-file]')).toBeNull();
    expect(document.querySelector('[data-postcard-locked]')).not.toBeNull();
  });

  it('offers a place’s travel poster when it has no city or wilderness photo', async () => {
    useLandmarks.mockReturnValue({ landmarks: [FRANCE[0], FRANCE[3]] });
    await open();
    expect([...document.querySelectorAll('[data-postcard-tab]')].map((t) => t.getAttribute('data-postcard-tab'))).toEqual(['c', 'l', 'own']);
    expect(pick('poster').getAttribute('aria-pressed')).toBe('true');
    expect(pick('poster').textContent).toBe('Its travel poster');
    write('Hi');
    await act(async () => fireEvent.click(sendButton()));
    expect(sendPostcard).toHaveBeenCalledWith(expect.objectContaining({ kind: 'COUNTRY', landmarkId: undefined }));
  });
});

describe('SendPostcard', () => {
  it('opens the maker for its place', async () => {
    render(
      <MemoryRouter>
        <SendPostcard countryCode='FR' placeName='France' />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Send a postcard'));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Send a postcard from France'));
    // No photos to offer for a place with none (a region's are its country's)
    fireEvent.click(tab('own'));
    expect(usePhotoPage).toHaveBeenLastCalledWith({ enabled: false });
  });
});
