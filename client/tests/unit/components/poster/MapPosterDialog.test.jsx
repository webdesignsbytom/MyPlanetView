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

const POSTER = { title: 'Charlie & Alex’s travels', subtitle: '12 countries', highlight: ['FR'], fileBase: 'charlie-alex' };
const PNG = new Blob(['png'], { type: 'image/png' });
const fakeCanvas = () => ({ width: 1, height: 1, toBlob: (done) => done(PNG) });

const open = () => render(<MapPosterDialog poster={POSTER} onClose={vi.fn()} />);
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
    expect(drawMapPoster).toHaveBeenLastCalledWith(expect.objectContaining({ title: POSTER.title, look: 'atlas', showNames: true, width: 1200, height: 849 }));
  });

  it('offers every paper size and both looks, A3 and the blue sea first', () => {
    open();
    const size = screen.getByLabelText('Paper size');
    expect([...size.querySelectorAll('option')].map((o) => o.value)).toEqual(['A4', 'A3', 'A2', '70x50']);
    expect(size.value).toBe('A3');
    const look = screen.getByLabelText('Look');
    expect([...look.querySelectorAll('option')].map((o) => o.textContent)).toEqual(['Blue sea', 'Old paper']);
    expect(look.value).toBe('atlas');
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

  it('downloads the print-size PNG with its file name and says what it saved', async () => {
    open();
    fireEvent.click(screen.getByText('Download the poster'));
    expect(status().textContent).toContain('Drawing your poster at print size');
    await waitFor(() => expect(downloadImage).toHaveBeenCalledWith(PNG, 'charlie-alex-poster-A3.png'));
    expect(printablePixels).toHaveBeenCalledWith('A3');
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
