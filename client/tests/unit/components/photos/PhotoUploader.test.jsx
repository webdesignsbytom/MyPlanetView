import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PhotoUploader from '@/components/photos/PhotoUploader';
import PhotoUploadItem from '@/components/photos/PhotoUploadItem';
import PhotoUploadPanel from '@/components/photos/PhotoUploadPanel';
import { uploadPhoto } from '@/utils/photos/uploadPhoto';
import { uploadVideo } from '@/utils/photos/uploadVideo';

vi.mock('@/utils/photos/uploadPhoto', () => ({ VIDEO_MAX_BYTES: 500 * 1024 * 1024, uploadPhoto: vi.fn() }));
vi.mock('@/utils/photos/uploadVideo', () => ({ VIDEOS_ARE_FIRST_CLASS: 'Videos come with First Class.', uploadVideo: vi.fn() }));
vi.mock('@/components/map/MapPanel', () => ({
  default: ({ title, children }) => (
    <section data-map-panel={title}>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));

const RULES = { keepsOriginals: true, photosPerCountry: 30, videos: null, locked: false };
const VIDEO_RULES = { ...RULES, videos: { perCountry: 20, maxSeconds: 180, maxBytes: 500 * 1024 * 1024 } };

const renderUploader = (props = {}) => render(<PhotoUploader mapId='m1' {...props} />, { wrapper: MemoryRouter });
const fileInput = () => document.querySelector('input[type="file"]');
const jpeg = (name = 'a.jpg') => new File(['x'], name, { type: 'image/jpeg' });

beforeEach(() => vi.clearAllMocks());

describe('PhotoUploader', () => {
  it('counts the chosen country’s photos against the plan’s cap', () => {
    renderUploader({ defaultCountryCode: 'FR', uploadRules: RULES, photoCounts: { FR: 12 } });
    expect(screen.getByText('12 of 30 photos of France on this map.').getAttribute('role')).toBe('status');
    expect(fileInput().disabled).toBe(false);
  });

  it('stops at the cap, with a way for the owner to upgrade', () => {
    renderUploader({ defaultCountryCode: 'FR', uploadRules: RULES, photoCounts: { FR: 30 }, isOwner: true });
    expect(screen.getByText('30 of 30 photos of France on this map.')).toBeTruthy();
    expect(screen.getByText(/That’s the most this map’s plan keeps of one country/)).toBeTruthy();
    expect(screen.getByText('Upgrade your plan')).toBeTruthy();
    expect(fileInput().disabled).toBe(true);
    expect(document.querySelector('label[aria-disabled="true"]')).toBeTruthy();
  });

  it('tells anyone but the owner that the plan is the owner’s', () => {
    renderUploader({ defaultCountryCode: 'FR', uploadRules: RULES, photoCounts: { FR: 31 } });
    const cap = screen.getByText(/That’s the most this map’s plan keeps/);
    expect(cap.textContent).toContain('The map’s owner can upgrade its plan.');
    expect(screen.queryByText('Upgrade your plan')).toBeNull();
  });

  it('gives the cap alone when the counts aren’t known, and nothing with no country chosen', () => {
    renderUploader({ uploadRules: RULES });
    expect(screen.getByText('This map keeps up to 30 photos of each country.')).toBeTruthy();
  });

  it('follows the country chosen in the dropdown', () => {
    renderUploader({ uploadRules: RULES, photoCounts: { IT: 3 } });
    fireEvent.change(screen.getByLabelText('Country for photos with no location'), { target: { value: 'IT' } });
    expect(screen.getByText('3 of 30 photos of Italy on this map.')).toBeTruthy();
  });

  it('says a locked map takes no photos', () => {
    renderUploader({ uploadRules: { ...RULES, locked: true }, isOwner: true });
    expect(fileInput()).toBeNull();
  });

  it('says Economy keeps a print copy, and every copy loses its location', () => {
    renderUploader({ uploadRules: { ...RULES, keepsOriginals: false } });
    expect(screen.getByText(/Economy keeps a print-quality copy/)).toBeTruthy();
    expect(screen.getByText(/Every copy has the location taken out/)).toBeTruthy();
  });

  it('offers the owner of a map without videos an upgrade to First Class', () => {
    renderUploader({ uploadRules: RULES, isOwner: true });
    expect(screen.getByText('Videos come with First Class.')).toBeTruthy();
    expect(screen.getByText('Upgrade to First Class').closest('a').getAttribute('href')).toBe('/account#account-plan-heading');
    expect(fileInput().getAttribute('accept')).toBe('image/jpeg,image/png,image/webp');
  });

  it('takes videos on First Class, counted against their own cap', () => {
    renderUploader({ defaultCountryCode: 'FR', uploadRules: VIDEO_RULES, photoCounts: { FR: 1 }, videoCounts: { FR: 20 } });
    expect(screen.getByText('Choose photos or videos')).toBeTruthy();
    expect(screen.getByText(/Videos: MP4 or MOV, up to 3 minutes and 500 MB each/)).toBeTruthy();
    expect(screen.getByText('20 of 20 videos of France on this map.').className).toContain('text-status-critical');
    expect(fileInput().getAttribute('accept')).toContain('video/mp4');
    expect(screen.queryByText('Upgrade to First Class')).toBeNull();
  });

  it('uploads each chosen photo and says where it went', async () => {
    uploadPhoto.mockImplementation(async ({ file, onStage }) => {
      onStage('uploading');
      return { photo: { id: file.name, countryCode: 'IT' }, hadLocation: true };
    });
    const onUploaded = vi.fn();
    const onBatchDone = vi.fn();
    renderUploader({ defaultCountryCode: 'FR', uploadRules: RULES, onUploaded, onBatchDone });
    fireEvent.change(fileInput(), { target: { files: [jpeg('a.jpg'), jpeg('b.jpg')] } });
    await waitFor(() => expect(onBatchDone).toHaveBeenCalledTimes(1));
    expect(onUploaded).toHaveBeenCalledTimes(2);
    expect(uploadPhoto.mock.calls[0][0]).toMatchObject({ mapId: 'm1', countryCode: 'FR', uploadRules: RULES });
    expect(screen.getAllByText('Placed in Italy from its location.').length).toBe(2);
    expect(screen.getAllByText('Added').length).toBe(2);
  });

  it('says why a photo wasn’t added, and skips the batch callback when none was', async () => {
    uploadPhoto.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Too big.' }));
    const onBatchDone = vi.fn();
    renderUploader({ uploadRules: RULES, onBatchDone });
    fireEvent.change(fileInput(), { target: { files: [jpeg()] } });
    expect(await screen.findByText('Too big.')).toBeTruthy();
    expect(screen.getByText('Not added')).toBeTruthy();
    expect(onBatchDone).not.toHaveBeenCalled();
  });

  it('takes dropped files too', async () => {
    uploadPhoto.mockResolvedValue({ photo: { id: 'x', countryCode: null }, hadLocation: false });
    renderUploader({ uploadRules: RULES });
    fireEvent.drop(document.querySelector('label[for]:not([for$="-country"])'), { dataTransfer: { files: [jpeg()] } });
    expect(await screen.findByText('No location in the file, so it’s under Unplaced photos until you choose a country.')).toBeTruthy();
  });

  it('sends a video to Stream, saying it plays once prepared', async () => {
    uploadVideo.mockResolvedValue({ photo: { id: 'v', countryCode: 'FR', videoState: 'PROCESSING' } });
    renderUploader({ defaultCountryCode: 'FR', uploadRules: VIDEO_RULES, videoCounts: { FR: 2 } });
    fireEvent.change(fileInput(), { target: { files: [new File(['x'], 'clip.mp4', { type: 'video/mp4' })] } });
    expect(await screen.findByText(/Videos keep no location, so it went in France\. It plays once it’s been prepared/)).toBeTruthy();
    expect(uploadVideo.mock.calls[0][0]).toMatchObject({ countryCode: 'FR', videoCount: 2 });
    expect(uploadPhoto).not.toHaveBeenCalled();
  });
});

describe('PhotoUploadItem', () => {
  const item = (patch) => render(<ul><PhotoUploadItem item={{ name: 'a.jpg', stage: 'waiting', ...patch }} /></ul>);

  it('says each stage in words, with a percentage while uploading', () => {
    item({ stage: 'uploading', progress: 0.42 });
    expect(screen.getByText('Uploading 42%')).toBeTruthy();
  });

  it('adds megabytes for a big upload, and asks to keep the page open for a video', () => {
    item({ stage: 'uploading', progress: 0.5, sent: 50 * 1024 * 1024, total: 100 * 1024 * 1024, video: true });
    expect(screen.getByText('Uploading 50% (50 of 100 MB)')).toBeTruthy();
    expect(screen.getByText('Keep this page open until it’s added.')).toBeTruthy();
  });

  it('uses a video’s own words for its steps', () => {
    item({ stage: 'cleaning', video: true });
    expect(screen.getByText('Taking out the location')).toBeTruthy();
  });

  it('shows the note once done, and the error once failed', () => {
    const { unmount } = item({ stage: 'done', note: 'Placed in France.' });
    expect(screen.getByText('Placed in France.')).toBeTruthy();
    unmount();
    item({ stage: 'failed', error: 'Nope.' });
    expect(screen.getByText('Not added').className).toContain('text-status-critical');
    expect(screen.getByText('Nope.')).toBeTruthy();
  });
});

describe('PhotoUploadPanel', () => {
  it('is titled with its country and holds the uploader', () => {
    render(<PhotoUploadPanel mapId='m1' countryCode='FR' uploadRules={RULES} onClose={() => {}} />, { wrapper: MemoryRouter });
    expect(document.querySelector('[data-map-panel]').getAttribute('data-map-panel')).toBe('Add photos: France');
    expect(fileInput()).toBeTruthy();
  });

  it('asks an unverified person to verify first instead', () => {
    render(<PhotoUploadPanel mapId='m1' locked onClose={() => {}} />, { wrapper: MemoryRouter });
    expect(document.querySelector('[data-map-panel]').getAttribute('data-map-panel')).toBe('Add photos');
    expect(screen.getByText(/Verify your email address to add photos/)).toBeTruthy();
    expect(fileInput()).toBeNull();
  });
});
