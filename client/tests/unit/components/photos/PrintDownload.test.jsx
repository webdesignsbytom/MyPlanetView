import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PrintDownload from '@/components/photos/PrintDownload';
import PrintDownloadDialog from '@/components/photos/PrintDownloadDialog';
import PrintDownloadPart from '@/components/photos/PrintDownloadPart';
import PrintDownloadSummary from '@/components/photos/PrintDownloadSummary';
import PrintPartnerOffers from '@/components/photos/PrintPartnerOffers';
import { listDownloadFiles } from '@/utils/photos/photoDownload';
import { canStreamToDisk, pickZipFile, saveZip } from '@/utils/photos/zipDownload';
import useOffers from '@/hooks/useOffers';

vi.mock('@/utils/photos/photoDownload', async (importOriginal) => ({ ...(await importOriginal()), listDownloadFiles: vi.fn() }));
vi.mock('@/utils/photos/zipDownload', () => ({ canStreamToDisk: vi.fn(), pickZipFile: vi.fn(), saveZip: vi.fn() }));
vi.mock('@/hooks/useOffers', () => ({ default: vi.fn() }));
vi.mock('@/api/offersApi', () => ({ offerClickUrl: (offer, { placement }) => `/go/${offer.id}?p=${placement}` }));
vi.mock('@/components/offers/OfferBrochure', () => ({
  default: ({ offer, href }) => (
    <a data-brochure={offer.id} href={href}>
      {offer.title}
    </a>
  ),
}));

const photo = (id, copy = 'ORIGINAL', bytes = 2e6, extra = {}) => ({
  id,
  caption: `Photo ${id}`,
  takenAt: '2024-05-01T10:00:00Z',
  best: { url: `/best/${id}`, copy, bytes, contentType: 'image/jpeg' },
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  useOffers.mockReturnValue({ offers: [], loading: false });
  canStreamToDisk.mockReturnValue(false);
});

describe('PrintDownloadSummary', () => {
  const summary = (list, parts = [list.files], streamToDisk = false) =>
    render(<PrintDownloadSummary list={{ videos: 0, missing: 0, unknownSizes: 0, ...list }} parts={parts} streamToDisk={streamToDisk} />);

  it('says there is nothing to download, and that videos never are', () => {
    summary({ files: [], totalBytes: 0, videos: 2 });
    expect(screen.getByText('There are no photos to download here yet.')).toBeTruthy();
    expect(screen.getByText('Videos aren’t included in downloads.')).toBeTruthy();
  });

  it('counts the photos and their size, and warns originals keep their location', () => {
    summary({ files: [{ copy: 'ORIGINAL' }, { copy: 'ORIGINAL' }], totalBytes: 4e6 });
    expect(screen.getByText('2 photos, 4 MB')).toBeTruthy();
    expect(screen.getByText(/They’re the originals, as uploaded/)).toBeTruthy();
  });

  it('splits originals from print copies, and names what’s left out', () => {
    summary({ files: [{ copy: 'ORIGINAL' }, { copy: 'PRINT' }], totalBytes: 3e6, unknownSizes: 1, videos: 1, missing: 2 });
    expect(screen.getByText('2 photos, at least 3 MB')).toBeTruthy();
    expect(screen.getByText(/1 photo is an original/)).toBeTruthy();
    expect(screen.getByText(/1 photo is a print copy, as Economy keeps/)).toBeTruthy();
    expect(screen.getByText(/1 video isn’t included/)).toBeTruthy();
    expect(screen.getByText('2 photos have no copy kept to download.')).toBeTruthy();
  });

  it('says how the zip comes: chosen on disk, or in parts', () => {
    const files = [{ copy: 'PRINT' }];
    const { unmount } = summary({ files, totalBytes: 1e6 }, [files], true);
    expect(screen.getByText(/You choose where to save it/)).toBeTruthy();
    unmount();
    summary({ files, totalBytes: 1e6 }, [files, files]);
    expect(screen.getByText(/it comes as 2 zip files of up to 500 MB/)).toBeTruthy();
  });
});

describe('PrintDownloadPart', () => {
  it('saves on its button, “again” once saved, naming what it couldn’t fetch', () => {
    const onSave = vi.fn();
    const failed = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    render(<PrintDownloadPart label='Download the zip' result={{ state: 'saved', fileName: 'Trip.zip', failed }} onSave={onSave} />);
    fireEvent.click(screen.getByText('Download the zip again'));
    expect(onSave).toHaveBeenCalled();
    expect(screen.getByText(/Saved Trip\.zip\. 7 photos couldn’t be fetched and aren’t in it: a, b, c, d, e and 2 more\./)).toBeTruthy();
  });

  it('shows its progress while it’s made, with Stop', () => {
    const onStop = vi.fn();
    render(<PrintDownloadPart label='Download the zip' run={{ done: 3, count: 10, bytes: 5e6, totalBytes: 2e7 }} onStop={onStop} />);
    const progress = screen.getByLabelText('Download the zip');
    expect(progress.tagName).toBe('PROGRESS');
    expect(progress.getAttribute('value')).toBe('3');
    expect(screen.getByText('3 of 10 photos · 5 MB of 20 MB')).toBeTruthy();
    fireEvent.click(screen.getByText('Stop'));
    expect(onStop).toHaveBeenCalled();
  });

  it('says it stopped, or failed', () => {
    const { rerender } = render(<PrintDownloadPart label='Zip' result={{ state: 'stopped' }} onSave={() => {}} />);
    expect(screen.getByText('Stopped. Nothing was saved.')).toBeTruthy();
    rerender(<PrintDownloadPart label='Zip' result={{ state: 'failed' }} onSave={() => {}} />);
    expect(screen.getByText(/The zip couldn’t be made/)).toBeTruthy();
  });
});

describe('PrintPartnerOffers', () => {
  it('says any printer takes the files when there is no print partner', () => {
    useOffers.mockReturnValue({ offers: [{ id: 'h', placements: ['GALLERY'] }], loading: false });
    render(<PrintPartnerOffers />);
    expect(screen.getByText('Print them')).toBeTruthy();
    expect(screen.getByText(/Every photo printer’s website takes these files/)).toBeTruthy();
  });

  it('says nothing while the offers load', () => {
    useOffers.mockReturnValue({ offers: [], loading: true });
    render(<PrintPartnerOffers fallback='No printers.' />);
    expect(screen.queryByText('No printers.')).toBeNull();
  });

  it('shows the two heaviest print partners, linked through /go/', () => {
    useOffers.mockReturnValue({
      offers: [
        { id: 'a', title: 'Light', placements: ['PRINT'], weight: 1 },
        { id: 'b', title: 'Heavy', placements: ['PRINT'], weight: 5 },
        { id: 'c', title: 'Middle', placements: ['PRINT'], weight: 3 },
      ],
      loading: false,
    });
    render(<PrintPartnerOffers title='Print your poster' lead='Upload it there.' />);
    expect(screen.getByText('Print your poster')).toBeTruthy();
    expect(screen.getByText('Upload it there.')).toBeTruthy();
    const brochures = [...document.querySelectorAll('[data-brochure]')];
    expect(brochures.map((b) => b.textContent)).toEqual(['Heavy', 'Middle']);
    expect(brochures[0].getAttribute('href')).toBe('/go/b?p=PRINT');
  });
});

describe('PrintDownloadDialog', () => {
  const open = (props = {}) => {
    const onClose = vi.fn();
    render(<PrintDownloadDialog scope={{ mapId: 'm1', country: 'FR' }} title='France' onClose={onClose} {...props} />);
    return { onClose };
  };

  it('lists the photos first, saying how many it has found', async () => {
    let finish;
    listDownloadFiles.mockImplementation((scope, { onProgress }) => {
      onProgress(40);
      return new Promise((r) => (finish = r));
    });
    open();
    expect(screen.getByText('Print or download: France')).toBeTruthy();
    expect(screen.getByText('Listing the photos… 40 so far')).toBeTruthy();
    expect(listDownloadFiles.mock.calls[0][0]).toEqual({ mapId: 'm1', tripId: undefined, country: 'FR' });
    await act(async () => finish({ photos: [photo('1')], pages: [] }));
    expect(screen.getByText('1 photo, 2 MB')).toBeTruthy();
    expect(screen.getByText('Download the zip')).toBeTruthy();
    expect(screen.getByText('Print them')).toBeTruthy();
  });

  it('says why the list failed, and tries again', async () => {
    listDownloadFiles.mockRejectedValueOnce(Object.assign(new Error('x'), { friendlyMessage: 'Offline.' }));
    listDownloadFiles.mockResolvedValueOnce({ photos: [], pages: [] });
    open();
    expect(await screen.findByText('Offline.')).toBeTruthy();
    fireEvent.click(screen.getByText('Try again'));
    expect(await screen.findByText('There are no photos to download here yet.')).toBeTruthy();
    expect(screen.queryByText('Download the zip')).toBeNull();
  });

  it('comes in parts when the browser holds each zip in memory', async () => {
    listDownloadFiles.mockResolvedValue({ photos: [photo('1', 'ORIGINAL', 3e8), photo('2', 'ORIGINAL', 3e8)], pages: [] });
    open();
    expect(await screen.findByText('Download part 1 of 2')).toBeTruthy();
    expect(screen.getByText('Download part 2 of 2')).toBeTruthy();
  });

  it('makes the zip and says it was saved', async () => {
    listDownloadFiles.mockResolvedValue({ photos: [photo('1')], pages: ['page'] });
    saveZip.mockResolvedValue({ failed: [] });
    open();
    fireEvent.click(await screen.findByText('Download the zip'));
    expect(await screen.findByText('Saved France.zip.')).toBeTruthy();
    expect(saveZip.mock.calls[0][0]).toMatchObject({ fileName: 'France.zip', writable: null, pages: ['page'] });
    expect(saveZip.mock.calls[0][0].files.map((f) => f.id)).toEqual(['1']);
  });

  it('asks where to save first where it can stream to disk, and stops if that’s cancelled', async () => {
    canStreamToDisk.mockReturnValue(true);
    pickZipFile.mockResolvedValue(null);
    listDownloadFiles.mockResolvedValue({ photos: [photo('1')], pages: [] });
    open();
    fireEvent.click(await screen.findByText('Download the zip'));
    await waitFor(() => expect(pickZipFile).toHaveBeenCalledWith('France.zip'));
    expect(saveZip).not.toHaveBeenCalled();
  });

  it('says the zip couldn’t be made when the download fails', async () => {
    listDownloadFiles.mockResolvedValue({ photos: [photo('1')], pages: [] });
    saveZip.mockRejectedValue(new Error('network'));
    open();
    fireEvent.click(await screen.findByText('Download the zip'));
    expect(await screen.findByText(/The zip couldn’t be made/)).toBeTruthy();
  });
});

describe('PrintDownload', () => {
  it('opens the dialog over the whole page when pressed', { timeout: 20000 }, async () => {
    listDownloadFiles.mockReturnValue(new Promise(() => {}));
    render(<PrintDownload scope={{ tripId: 't1' }} title='Italian summer' />);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    fireEvent.click(screen.getByText('Print or download'));
    expect(await screen.findByText('Print or download: Italian summer', {}, { timeout: 10000 })).toBeTruthy();
    expect(listDownloadFiles.mock.calls[0][0]).toEqual({ mapId: undefined, tripId: 't1', country: undefined });
  });

  it('takes its own label', () => {
    render(<PrintDownload scope={{ mapId: 'm1' }} title='Map' label='Download the whole map' />);
    expect(screen.getByText('Download the whole map')).toBeTruthy();
  });
});
