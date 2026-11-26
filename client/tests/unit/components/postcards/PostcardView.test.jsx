// A postcard shown as its drawn pictures (components/postcards/PostcardView.jsx), turned over and
// downloaded; and its link box (PostcardLinkBox.jsx)
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PostcardView from '@/components/postcards/PostcardView';
import { postcardFileName } from '@/utils/postcards/postcardRules';
import PostcardLinkBox from '@/components/postcards/PostcardLinkBox';
import { drawPostcard } from '@/utils/postcards/drawPostcard';
import { postcardArt } from '@/utils/postcards/postcardArt';

vi.mock('@/hooks/useLandmarkPhotos', () => ({ default: () => null }));
vi.mock('@/utils/postcards/postcardArt', () => ({ postcardArt: vi.fn(() => ({ kind: 'COUNTRY' })) }));
vi.mock('@/utils/postcards/drawPostcard', () => ({
  drawPostcard: vi.fn(async () => ({ front: { side: 'front' }, back: { side: 'back' } })),
  canvasPng: vi.fn(async (canvas) => new Blob([canvas.side], { type: 'image/png' })),
}));

const CARD = { code: 'PST2-CRD8-FRNC', kind: 'COUNTRY', countryCode: 'FR', landmark: null, style: 'classic', message: 'Bonjour Gran!', toName: 'Gran', fromName: 'Charlie', sentAt: '2026-11-22T10:00:00.000Z' };
let n;
beforeEach(() => {
  vi.clearAllMocks();
  n = 0;
  URL.createObjectURL = vi.fn(() => `blob:${++n}`);
  URL.revokeObjectURL = vi.fn();
});
const view = () => document.querySelector('[data-postcard-view]');

describe('PostcardView', () => {
  it('says it’s drawing, then shows the front with words for screen readers, and turns over', async () => {
    render(<PostcardView card={CARD} />);
    expect(screen.getByRole('status').textContent).toBe('Drawing the postcard…');
    await waitFor(() => expect(view().getAttribute('data-postcard-drawn')).toBe('true'));
    expect(postcardArt).toHaveBeenCalledWith(CARD, null);
    expect(drawPostcard).toHaveBeenCalledWith(CARD, { kind: 'COUNTRY' });
    const front = document.querySelector('[data-postcard-face="front"]');
    const back = document.querySelector('[data-postcard-face="back"]');
    expect(front.getAttribute('alt')).toBe('The front of the postcard: “Greetings from France”.');
    expect(back.getAttribute('alt')).toBe('The back of the postcard. The message: “Bonjour Gran!” To Gran. From Charlie.');
    expect(back.getAttribute('aria-hidden')).toBe('true');

    fireEvent.click(screen.getByLabelText('Turn it over to see the back'));
    expect(view().getAttribute('data-postcard-side')).toBe('back');
    expect(front.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByLabelText('Turn it over to see the front')).toBeTruthy();
    // No downloads unless asked for
    expect(document.querySelector('[data-postcard-download]')).toBeNull();
  });

  it('offers both sides to download, named for the place', async () => {
    render(<PostcardView card={{ ...CARD, kind: 'LANDMARK', landmark: { name: 'Sagrada Família' }, countryCode: 'ES' }} downloads />);
    await waitFor(() => expect(document.querySelector('[data-postcard-download="front"]')).not.toBeNull());
    expect(document.querySelector('[data-postcard-download="front"]').getAttribute('download')).toBe('a-postcard-from-sagrada-familia-front.png');
    expect(document.querySelector('[data-postcard-download="back"]').getAttribute('href')).toBe('blob:2');
  });

  it('draws it again only when what’s on it changes, letting the old pictures go', async () => {
    const { rerender, unmount } = render(<PostcardView card={CARD} />);
    await waitFor(() => expect(drawPostcard).toHaveBeenCalledTimes(1));
    rerender(<PostcardView card={{ ...CARD }} />);
    rerender(<PostcardView card={{ ...CARD, message: 'Changed' }} />);
    await waitFor(() => expect(drawPostcard).toHaveBeenCalledTimes(2));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
    unmount();
  });

  it('follows the side its parent holds', async () => {
    const onTurn = vi.fn();
    render(<PostcardView card={CARD} side='back' onTurn={onTurn} />);
    await waitFor(() => expect(view().getAttribute('data-postcard-drawn')).toBe('true'));
    expect(view().getAttribute('data-postcard-side')).toBe('back');
    fireEvent.click(screen.getByLabelText('Turn it over to see the front'));
    expect(onTurn).toHaveBeenCalled();
  });

  it('says so when it can’t be drawn', async () => {
    drawPostcard.mockRejectedValueOnce(new Error('no canvas'));
    render(<PostcardView card={CARD} />);
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('The postcard couldn’t be drawn here. Please try again.'));
  });

  it('names its files from the place', () => {
    expect(postcardFileName({ countryCode: 'CI', kind: 'COUNTRY' }, 'back')).toBe('a-postcard-from-cote-d-ivoire-back.png');
  });
});

describe('PostcardLinkBox', () => {
  it('shows the card’s link, copies it and opens it in a new tab', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<PostcardLinkBox postcard={{ code: 'PST2-CRD8-FRNC' }} name='your postcard to Gran' />);
    const link = `${window.location.origin}/postcard/PST2-CRD8-FRNC`;
    expect(screen.getByLabelText('Link to your postcard to Gran').value).toBe(link);
    await act(async () => fireEvent.click(screen.getByLabelText('Copy the link to your postcard to Gran')));
    expect(writeText).toHaveBeenCalledWith(link);
    expect(screen.getByText('Copied: paste it to whoever the card is for.')).toBeTruthy();
    const open = screen.getByLabelText('Open your postcard to Gran (opens in a new tab)');
    expect(open.getAttribute('target')).toBe('_blank');
    writeText.mockRejectedValueOnce(new Error('denied'));
    await act(async () => fireEvent.click(screen.getByLabelText('Copy the link to your postcard to Gran')));
    expect(screen.getByText('It couldn’t be copied here: select the link and copy it yourself.')).toBeTruthy();
  });

  it('offers the share sheet where the browser has one', async () => {
    const share = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    render(<PostcardLinkBox postcard={{ code: 'PST2-CRD8-FRNC' }} />);
    await act(async () => fireEvent.click(screen.getByLabelText('Share your postcard')));
    expect(share).toHaveBeenCalledWith({ title: 'A postcard for you', url: `${window.location.origin}/postcard/PST2-CRD8-FRNC` });
    delete navigator.share;
  });
});
