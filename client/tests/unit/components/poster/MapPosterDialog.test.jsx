import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MapPosterDialog from '@/components/poster/MapPosterDialog';
import { drawMapPoster, posterPng, printablePixels } from '@/utils/poster/drawMapPoster';
import { downloadImage } from '@/utils/shareCard/shareImage';
import useOffers from '@/hooks/useOffers';

// The canvas drawing is drawMapPoster's own; here it's a fake canvas that hands back a PNG
vi.mock('@/utils/poster/drawMapPoster', async (importOriginal) => ({
  ...(await importOriginal()),
  drawMapPoster: vi.fn(),
  posterPng: vi.fn(),
  printablePixels: vi.fn(),
}));
vi.mock('@/utils/shareCard/shareImage', () => ({ downloadImage: vi.fn() }));
vi.mock('@/hooks/useOffers', () => ({ default: vi.fn() }));

const POSTER = {
  title: 'Charlie & Alex’s travels',
  subtitle: '12 countries',
  highlight: ['FR'],
  fileBase: 'charlie-alex',
  colours: null,
  look: 'animated',
  coloursByLook: { animated: null, mono: null, 'old-map': null, starry: { FR: '#aa0000' }, engraved: null, paper: null },
};
const PNG = new Blob(['png'], { type: 'image/png' });
const fakeCanvas = () => ({ width: 1, height: 1, toBlob: (done) => done(PNG) });

const open = (poster = POSTER) => render(<MapPosterDialog poster={poster} onClose={vi.fn()} />);
const dialog = () => document.querySelector('[role="dialog"]');
const status = () => dialog().querySelector('[data-poster-status]');

beforeEach(() => {
  vi.clearAllMocks();
  drawMapPoster.mockImplementation(async () => fakeCanvas());
  posterPng.mockResolvedValue(PNG);
  printablePixels.mockReturnValue({ width: 4961, height: 3508, dpi: 300 });
  useOffers.mockReturnValue({ offers: [], loading: false, error: null });
  URL.createObjectURL = vi.fn(() => 'blob:poster');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  delete URL.createObjectURL;
  delete URL.revokeObjectURL;
});

describe('MapPosterDialog', () => {
  it('draws a preview after a moment, at the paper’s shape', async () => {
    open();
    expect(dialog().textContent).toContain('A poster of your map');
    expect(dialog().textContent).toContain('Drawing the preview…');
    const img = await waitFor(() => {
      const found = dialog().querySelector('[data-poster-preview]');
      if (!found) throw new Error('not yet');
      return found;
    });
    expect(img.getAttribute('src')).toBe('blob:poster');
    expect(img.getAttribute('alt')).toBe('The poster: Charlie & Alex’s travels, with your countries coloured in');
    // A3 landscape: 420 × 297 mm
    expect(drawMapPoster).toHaveBeenLastCalledWith(expect.objectContaining({ title: POSTER.title, look: 'animated', showNames: true, width: 1200, height: 849 }));
  });

  // 27 Nov 2026, the user's wish: every map style as a look, and a custom size
  it('offers every paper size and a custom one, and every map style’s look, A3 and the map’s own style first', () => {
    open();
    const size = screen.getByLabelText('Paper size');
    expect([...size.querySelectorAll('option')].map((o) => o.value)).toEqual(['A4', 'A3', 'A2', '70x50', 'custom']);
    expect([...size.querySelectorAll('option')].at(-1).textContent).toBe('Custom size');
    expect(size.value).toBe('A3');
    const look = screen.getByLabelText('Look');
    expect([...look.querySelectorAll('option')].map((o) => o.textContent)).toEqual([
      'World map',
      'Black and white',
      'Old map',
      'Starry night',
      'Engraved ocean',
      'Old paper',
    ]);
    expect(look.value).toBe('animated');
    expect(dialog().querySelector('[data-poster-custom-size]')).toBeNull();
    expect(screen.getByLabelText('Title').value).toBe(POSTER.title);
    expect(screen.getByLabelText('Name the countries under the map').checked).toBe(true);
  });

  it('redraws the preview with each choice', async () => {
    open();
    fireEvent.change(screen.getByLabelText('Paper size'), { target: { value: '70x50' } });
    fireEvent.change(screen.getByLabelText('Look'), { target: { value: 'paper' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Our world' } });
    fireEvent.click(screen.getByLabelText('Name the countries under the map'));
    await waitFor(() =>
      expect(drawMapPoster).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Our world', look: 'paper', showNames: false, width: 1200, height: 857 })),
    );
  });

  it('starts in the map’s own style, each look in that style’s design colours', async () => {
    open({ ...POSTER, look: 'starry' });
    expect(screen.getByLabelText('Look').value).toBe('starry');
    await waitFor(() => expect(drawMapPoster).toHaveBeenLastCalledWith(expect.objectContaining({ look: 'starry', colours: { FR: '#aa0000' } })));
    fireEvent.change(screen.getByLabelText('Look'), { target: { value: 'mono' } });
    await waitFor(() => expect(drawMapPoster).toHaveBeenLastCalledWith(expect.objectContaining({ look: 'mono', colours: null })));
  });

  it('takes a custom size, starting as the size chosen before, wide or tall', async () => {
    open();
    fireEvent.change(screen.getByLabelText('Paper size'), { target: { value: 'custom' } });
    const width = screen.getByLabelText('Width (cm)');
    const height = screen.getByLabelText('Height (cm)');
    expect([width.value, height.value]).toEqual(['42', '29.7']);
    expect(width.getAttribute('inputmode')).toBe('decimal');
    expect(dialog().querySelector('[data-poster-custom-size]').textContent).toContain('Any size from 10 to 150 cm a side, wide or tall.');
    // A tall one: the preview's longer side is its height
    fireEvent.change(width, { target: { value: '30' } });
    fireEvent.change(height, { target: { value: '40' } });
    await waitFor(() => expect(drawMapPoster).toHaveBeenLastCalledWith(expect.objectContaining({ width: 900, height: 1200 })));

    fireEvent.click(screen.getByText('Download the poster'));
    await waitFor(() => expect(downloadImage).toHaveBeenCalledWith(PNG, 'charlie-alex-poster-30x40cm.png'));
    expect(printablePixels).toHaveBeenCalledWith(expect.objectContaining({ id: 'custom', mm: [300, 400] }));
    expect(status().textContent).toBe('Saved: 4,961 × 3,508 pixels, 30 × 40 cm at 300 dpi.');
  });

  it('says what’s wrong with a custom size, and won’t make it', async () => {
    open();
    fireEvent.change(screen.getByLabelText('Paper size'), { target: { value: 'custom' } });
    await waitFor(() => expect(drawMapPoster).toHaveBeenCalled());
    const drawn = drawMapPoster.mock.calls.length;
    fireEvent.change(screen.getByLabelText('Width (cm)'), { target: { value: '500' } });
    const note = dialog().querySelector('[data-poster-custom-size] p');
    expect(note.textContent).toBe('Each side is 10 to 150 cm.');
    expect(note.className).toContain('text-status-critical');
    expect(screen.getByLabelText('Width (cm)').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Width (cm)').getAttribute('aria-describedby')).toBe(note.id);
    expect(screen.getByText('Download the poster').closest('button').disabled).toBe(true);
    // No preview is drawn for it
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(drawMapPoster.mock.calls.length).toBe(drawn);
    fireEvent.change(screen.getByLabelText('Width (cm)'), { target: { value: '' } });
    expect(note.textContent).toBe('Type the width and the height in centimetres.');
  });

  it('downloads the print-size PNG with its file name and says what it saved', async () => {
    open();
    fireEvent.click(screen.getByText('Download the poster'));
    expect(status().textContent).toContain('Drawing your poster at print size');
    await waitFor(() => expect(downloadImage).toHaveBeenCalledWith(PNG, 'charlie-alex-poster-A3.png'));
    expect(printablePixels).toHaveBeenCalledWith(expect.objectContaining({ id: 'A3' }));
    expect(drawMapPoster).toHaveBeenCalledWith(expect.objectContaining({ width: 4961, height: 3508 }));
    expect(posterPng).toHaveBeenCalledWith(expect.anything(), 300);
    expect(status().textContent).toBe('Saved: 4,961 × 3,508 pixels, A3 (42 × 29.7 cm) at 300 dpi.');
    expect(status().className).not.toContain('text-status-critical');
  });

  it('says when the browser could only manage fewer dots per inch', async () => {
    printablePixels.mockReturnValue({ width: 3307, height: 2339, dpi: 200 });
    open();
    fireEvent.click(screen.getByText('Download the poster'));
    await waitFor(() => expect(status().textContent).toContain('at 200 dpi (the most this browser can draw)'));
  });

  it('says why a poster too big for the browser couldn’t be made', async () => {
    printablePixels.mockReturnValue(null);
    open();
    fireEvent.change(screen.getByLabelText('Paper size'), { target: { value: '70x50' } });
    fireEvent.click(screen.getByText('Download the poster'));
    await waitFor(() => expect(status().textContent).toContain('This browser can’t draw a poster that big'));
    expect(status().className).toContain('text-status-critical');
    expect(downloadImage).not.toHaveBeenCalled();
  });

  it('says when the preview couldn’t be drawn', async () => {
    drawMapPoster.mockRejectedValue(new Error('no canvas'));
    open();
    expect((await screen.findByText('The preview couldn’t be drawn.')).getAttribute('role')).toBe('alert');
  });

  it('ends with the print partners, in its own words', () => {
    open();
    expect(dialog().querySelector('#print-them-heading').textContent).toBe('Have it printed');
    expect(dialog().textContent).toContain('Any print shop or photo printer’s website takes this file');
  });
});
