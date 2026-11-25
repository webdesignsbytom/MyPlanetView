import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ShareCardDialog from '@/components/shareCard/ShareCardDialog';
import ShareCardPreview from '@/components/shareCard/ShareCardPreview';
import { drawShareCard } from '@/utils/shareCard/drawShareCard';

// The canvas drawing is drawShareCard's own test's; here it hands back a PNG blob
vi.mock('@/utils/shareCard/drawShareCard', () => ({ drawShareCard: vi.fn() }));

const CARD = {
  title: '2026 in travel',
  stats: [
    { value: 12, label: 'countries' },
    { value: 340, label: 'photos' },
  ],
  fileName: 'my-planet-view-2026.png',
  shareText: 'My 2026 in travel: 12 countries.',
};
const PNG = new Blob(['png'], { type: 'image/png' });

const setNavigator = (name, value) => Object.defineProperty(navigator, name, { value, configurable: true, writable: true });

let saved;

beforeEach(() => {
  vi.clearAllMocks();
  drawShareCard.mockResolvedValue(PNG);
  URL.createObjectURL = vi.fn(() => 'blob:share-card');
  URL.revokeObjectURL = vi.fn();
  saved = [];
  // The download link's click: noted, not followed
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
    saved.push({ href: this.getAttribute('href'), download: this.download });
  });
});

afterEach(() => {
  delete navigator.canShare;
  delete navigator.share;
  delete URL.createObjectURL;
  delete URL.revokeObjectURL;
});

describe('ShareCardPreview', () => {
  it('draws the picture, then shows it with words for screen readers', async () => {
    render(<ShareCardPreview card={CARD} />);
    expect(screen.getByText('Making your picture…')).toBeTruthy();
    const img = await waitFor(() => {
      const found = document.querySelector('[data-share-card]');
      if (!found) throw new Error('not yet');
      return found;
    });
    expect(drawShareCard).toHaveBeenCalledWith(CARD);
    expect(img.getAttribute('src')).toBe('blob:share-card');
    expect(img.getAttribute('alt')).toBe('Your share card: 2026 in travel, 12 countries, 340 photos');
  });

  it('a browser that can’t share files gets Save only, which downloads the PNG by its name', async () => {
    render(<ShareCardPreview card={CARD} />);
    expect(screen.queryByText('Share')).toBeNull();
    const save = screen.getByText('Save the picture').closest('button');
    expect(save.disabled).toBe(true);
    await waitFor(() => expect(save.disabled).toBe(false));
    fireEvent.click(save);
    expect(saved).toEqual([{ href: 'blob:share-card', download: 'my-planet-view-2026.png' }]);
    expect(screen.getByText('Saved to your downloads.')).toBeTruthy();
  });

  it('shares the picture as a file with its title and text', async () => {
    setNavigator('canShare', vi.fn(() => true));
    setNavigator('share', vi.fn().mockResolvedValue());
    render(<ShareCardPreview card={CARD} />);
    const share = screen.getByText('Share').closest('button');
    await waitFor(() => expect(share.disabled).toBe(false));
    fireEvent.click(share);
    await waitFor(() => expect(navigator.share).toHaveBeenCalled());
    const [{ files, title, text }] = navigator.share.mock.calls[0];
    expect(files[0].name).toBe('my-planet-view-2026.png');
    expect(files[0].type).toBe('image/png');
    expect(title).toBe('2026 in travel');
    expect(text).toBe('My 2026 in travel: 12 countries.');
    expect(saved).toEqual([]);
  });

  it('saves instead when sharing fails, and says so', async () => {
    setNavigator('canShare', vi.fn(() => true));
    setNavigator('share', vi.fn().mockRejectedValue(new Error('not allowed')));
    render(<ShareCardPreview card={CARD} />);
    const share = screen.getByText('Share').closest('button');
    await waitFor(() => expect(share.disabled).toBe(false));
    fireEvent.click(share);
    expect(await screen.findByText('Saved to your downloads instead.')).toBeTruthy();
    expect(saved[0].download).toBe('my-planet-view-2026.png');
  });

  it('closing the share sheet is not a failure: nothing is saved', async () => {
    setNavigator('canShare', vi.fn(() => true));
    setNavigator('share', vi.fn().mockRejectedValue(Object.assign(new Error('closed'), { name: 'AbortError' })));
    render(<ShareCardPreview card={CARD} />);
    const share = screen.getByText('Share').closest('button');
    await waitFor(() => expect(share.disabled).toBe(false));
    fireEvent.click(share);
    await waitFor(() => expect(navigator.share).toHaveBeenCalled());
    expect(saved).toEqual([]);
    expect(screen.queryByText(/Saved to your downloads/)).toBeNull();
  });

  it('says why the picture couldn’t be made', async () => {
    drawShareCard.mockRejectedValue(new Error('No canvas here.'));
    render(<ShareCardPreview card={CARD} />);
    expect((await screen.findByText('No canvas here.')).getAttribute('role')).toBe('alert');
    expect(screen.getByText('Save the picture').closest('button').disabled).toBe(true);
  });

  // 25 Nov 2026, the user's wish: "a preview of the post"
  it('shows the post: the picture with its words under it, together', async () => {
    render(<ShareCardPreview card={CARD} />);
    const post = document.querySelector('[data-post-preview]');
    expect(post.getAttribute('aria-label')).toBe('Preview of your post');
    await waitFor(() => expect(post.querySelector('[data-share-card]')).toBeTruthy());
    const words = screen.getByLabelText('Words to go with it');
    expect(post.contains(words)).toBe(true);
    expect(words.value).toBe('My 2026 in travel: 12 countries.');
  });

  it('sends the words as they were changed', async () => {
    setNavigator('canShare', vi.fn(() => true));
    setNavigator('share', vi.fn().mockResolvedValue());
    render(<ShareCardPreview card={CARD} />);
    fireEvent.change(screen.getByLabelText('Words to go with it'), { target: { value: '  Twelve and counting!  ' } });
    const share = screen.getByText('Share').closest('button');
    await waitFor(() => expect(share.disabled).toBe(false));
    fireEvent.click(share);
    await waitFor(() => expect(navigator.share).toHaveBeenCalled());
    expect(navigator.share.mock.calls[0][0].text).toBe('Twelve and counting!');
  });

  it('copies the words, for apps that leave them out, and says so', async () => {
    const writeText = vi.fn().mockResolvedValue();
    setNavigator('clipboard', { writeText });
    render(<ShareCardPreview card={CARD} />);
    fireEvent.click(screen.getByText('Copy the words').closest('button'));
    expect(await screen.findByText('The words are copied: paste them under your post.')).toBeTruthy();
    expect(writeText).toHaveBeenCalledWith('My 2026 in travel: 12 countries.');

    writeText.mockRejectedValue(new Error('denied'));
    fireEvent.click(screen.getByText('Copy the words').closest('button'));
    expect(await screen.findByText(/couldn’t be copied here/)).toBeTruthy();
    delete navigator.clipboard;
  });

  it('has nothing to copy with no words, and a new card starts with its own', () => {
    const { rerender } = render(<ShareCardPreview card={CARD} />);
    fireEvent.change(screen.getByLabelText('Words to go with it'), { target: { value: '   ' } });
    expect(screen.getByText('Copy the words').closest('button').disabled).toBe(true);
    rerender(<ShareCardPreview card={{ ...CARD, shareText: 'Another card.' }} />);
    expect(screen.getByLabelText('Words to go with it').value).toBe('Another card.');
    expect(screen.getByText('Copy the words').closest('button').disabled).toBe(false);
  });

  it('lets the old picture go when it unmounts', async () => {
    const { unmount } = render(<ShareCardPreview card={CARD} />);
    await waitFor(() => expect(document.querySelector('[data-share-card]')).toBeTruthy());
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:share-card');
  });
});

describe('ShareCardDialog', () => {
  it('is a dialog over the page with its title, the note and the preview', async () => {
    const onClose = vi.fn();
    render(<ShareCardDialog card={CARD} onClose={onClose} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('Share a picture of your map');
    expect(dialog.textContent).toContain('never your photos');
    await waitFor(() => expect(dialog.querySelector('[data-share-card]')).toBeTruthy());
  });

  it('takes its own title', () => {
    render(<ShareCardDialog card={CARD} title='Share your year' onClose={() => {}} />);
    expect(document.querySelector('[role="dialog"]').textContent).toContain('Share your year');
  });
});
