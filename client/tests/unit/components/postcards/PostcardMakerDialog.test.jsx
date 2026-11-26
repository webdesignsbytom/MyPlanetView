// "Send a postcard" (components/postcards/: SendPostcard, PostcardMakerDialog, PostcardPictureFields,
// PostcardStylePicker; 26 Nov 2026, the user's wish; docs/API.md "Postcards")
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PostcardMakerDialog from '@/components/postcards/PostcardMakerDialog';
import SendPostcard from '@/components/postcards/SendPostcard';
import { getMyPostcards, sendPostcard } from '@/api/postcardsApi';
import usePhotoPage from '@/hooks/usePhotoPage';
import { photoAsBlob, uploadPostcardPicture } from '@/utils/postcards/uploadPostcardPicture';

vi.mock('@/api/postcardsApi', () => ({ getMyPostcards: vi.fn(), sendPostcard: vi.fn() }));
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Charlie Reid' } }) }));
vi.mock('@/hooks/useLandmarkPhotos', () => ({ default: () => null }));
vi.mock('@/hooks/useLandmarks', () => ({
  default: () => ({
    landmarks: [
      { id: 'lm-eiffel', name: 'Eiffel Tower', slug: 'eiffel-tower', wikidataId: 'Q243', countryCode: 'FR' },
      { id: 'lm-none', name: 'A place with no picture', slug: 'no-picture', wikidataId: 'Q0', countryCode: 'FR' },
    ],
  }),
}));
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
const kindInput = (kind) => document.querySelector(`[data-postcard-kind="${kind}"] input`);
const preview = () => document.querySelector('[data-postcard-preview]');
const sendButton = () => screen.getByText('Send the postcard').closest('button');

describe('PostcardMakerDialog', () => {
  it('starts with the country’s own card, the classic style and the sender’s first name, and previews it', async () => {
    await open();
    expect(document.querySelector('[role="dialog"]').textContent).toContain('Send a postcard from France');
    expect(kindInput('COUNTRY').checked).toBe(true);
    expect(document.querySelector('[data-postcard-style="classic"] input').checked).toBe(true);
    expect(screen.getByLabelText('From').value).toBe('Charlie');
    expect(preview().getAttribute('data-postcard-preview')).toBe('COUNTRY');
    expect(preview().textContent).toContain('Your message goes here.');
    expect(screen.getByText('0 of 400 characters')).toBeTruthy();
  });

  it('sends a country’s card in the style chosen, then shows its link', async () => {
    const { onClose } = await open();
    fireEvent.click(document.querySelector('[data-postcard-style="night"] input'));
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Bonjour!' } });
    // Writing turns the preview over
    expect(preview().getAttribute('data-side')).toBe('back');
    fireEvent.change(screen.getByLabelText('To'), { target: { value: ' Gran ' } });
    await act(async () => fireEvent.click(sendButton()));
    expect(sendPostcard).toHaveBeenCalledWith({
      kind: 'COUNTRY',
      countryCode: 'FR',
      landmarkId: undefined,
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
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Hi' } });
    await act(async () => fireEvent.click(sendButton()));
    expect(screen.getByText('Postcards of landmarks… come with Business')).toBeTruthy();
  });

  it('sends a landmark’s card, offering only the place’s landmarks with a photo or a model', async () => {
    await open();
    fireEvent.click(kindInput('LANDMARK'));
    const select = screen.getByLabelText('Which landmark?');
    expect([...select.options].map((o) => o.textContent)).toEqual(['Choose a landmark', 'Eiffel Tower']);
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Up the tower' } });
    await act(async () => fireEvent.click(sendButton()));
    expect(screen.getByText('Choose the landmark for the front.')).toBeTruthy();
    fireEvent.change(select, { target: { value: 'lm-eiffel' } });
    await waitFor(() => expect(preview().textContent).toContain('Eiffel Tower'));
    await act(async () => fireEvent.click(sendButton()));
    expect(sendPostcard).toHaveBeenCalledWith(expect.objectContaining({ kind: 'LANDMARK', landmarkId: 'lm-eiffel' }));
  });

  it('sends a card from one of the place’s photos, or one from the device', async () => {
    await open();
    fireEvent.click(kindInput('PHOTO'));
    expect(usePhotoPage).toHaveBeenCalledWith({ mapId: 'm1', country: 'FR', display: true });
    // Photos only, never a video
    expect(document.querySelector('[data-postcard-photo="v-1"]')).toBeNull();
    await act(async () => fireEvent.click(document.querySelector('[data-postcard-photo="p-1"]')));
    expect(photoAsBlob).toHaveBeenCalledWith('/d.jpg');
    expect(uploadPostcardPicture).toHaveBeenCalled();
    expect(document.querySelector('[data-postcard-own-photo]').getAttribute('src')).toBe('blob:own');
    expect(document.querySelector('[data-postcard-photo="p-1"]').getAttribute('aria-pressed')).toBe('true');

    const file = new File(['x'], 'mine.jpg', { type: 'image/jpeg' });
    await act(async () => fireEvent.change(document.querySelector('[data-postcard-file]'), { target: { files: [file] } }));
    expect(uploadPostcardPicture).toHaveBeenLastCalledWith(file, expect.any(Function));
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'Our photo' } });
    await act(async () => fireEvent.click(sendButton()));
    expect(sendPostcard).toHaveBeenCalledWith(expect.objectContaining({ kind: 'PHOTO', pictureKey: 'myplanetview/postcards/u/card-a.webp' }));
  });

  it('turns away a HEIC file and says why an upload failed', async () => {
    await open();
    fireEvent.click(kindInput('PHOTO'));
    await act(async () => fireEvent.change(document.querySelector('[data-postcard-file]'), { target: { files: [new File(['x'], 'IMG.HEIC')] } }));
    expect(screen.getByText('That photo is an iPhone HEIC file. Please save it as a JPEG first.')).toBeTruthy();
    uploadPostcardPicture.mockRejectedValueOnce(new Error('That photo is too detailed to use. Please choose another.'));
    await act(async () => fireEvent.click(document.querySelector('[data-postcard-photo="p-1"]')));
    expect(screen.getByText('That photo is too detailed to use. Please choose another.')).toBeTruthy();
  });

  it('locks the landmark and photo cards on a plan without them, saying which plans have them', async () => {
    getMyPostcards.mockResolvedValue({ postcards: [], paidCards: false });
    await open();
    await waitFor(() => expect(kindInput('LANDMARK').disabled).toBe(true));
    expect(kindInput('PHOTO').disabled).toBe(true);
    expect(kindInput('COUNTRY').disabled).toBe(false);
    expect(document.querySelector('[data-postcard-kind="PHOTO"]').textContent).toContain('With Business and First Class.');
    expect(screen.getByText('See the plans').getAttribute('href')).toBe('/pricing');
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
    fireEvent.click(kindInput('PHOTO'));
    expect(usePhotoPage).toHaveBeenLastCalledWith({ enabled: false });
  });
});
