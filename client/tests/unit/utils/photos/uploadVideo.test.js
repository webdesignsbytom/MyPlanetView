import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/travelApi', () => ({ startVideoUpload: vi.fn(), saveVideo: vi.fn() }));
vi.mock('@/utils/photos/videoFile', async (importOriginal) => ({
  ...(await importOriginal()),
  readVideoInfo: vi.fn(),
  stripVideoLocation: vi.fn(),
}));
vi.mock('@/utils/photos/videoElementLength', () => ({ readVideoElementLength: vi.fn() }));
vi.mock('@/utils/photos/streamUpload', () => ({ sendToStream: vi.fn() }));

import { saveVideo, startVideoUpload } from '@/api/travelApi';
import { readVideoInfo, stripVideoLocation } from '@/utils/photos/videoFile';
import { readVideoElementLength } from '@/utils/photos/videoElementLength';
import { sendToStream } from '@/utils/photos/streamUpload';
import { VIDEOS_ARE_FIRST_CLASS, uploadVideo, videoCapMessage } from '@/utils/photos/uploadVideo';
import { LOCKED_MAP } from '@/utils/photos/uploadPhoto';

const MB = 1024 * 1024;
const rules = { videos: { contentTypes: ['video/mp4', 'video/quicktime'], maxBytes: 500 * MB, maxSeconds: 180, perCountry: 20 } };
const video = (extra = {}) => ({ type: 'video/mp4', name: 'clip.mp4', size: 4000, ...extra });
const cleaned = { size: 4000, kind: 'cleaned copy' };

beforeEach(() => {
  vi.clearAllMocks();
  readVideoInfo.mockResolvedValue({ seconds: 41.2, durationS: 42, recordedAt: '2025-06-14T09:00:00.000Z' });
  stripVideoLocation.mockResolvedValue(cleaned);
  startVideoUpload.mockResolvedValue({ uploadUrl: 'https://upload.example/tus/1', ticket: 'ticket-1' });
  sendToStream.mockResolvedValue();
  saveVideo.mockResolvedValue({ photo: { id: 'v1', videoState: 'PROCESSING' } });
});

describe('videoCapMessage', () => {
  it('words a full country as the server does', () => {
    expect(videoCapMessage(20, 20, 'IT')).toBe('20 of 20 videos of Italy on this map.');
    expect(videoCapMessage(25, 20, 'IT')).toBe('20 of 20 videos of Italy on this map.');
  });
});

describe('uploadVideo refuses before anything is sent', () => {
  const refusal = (args) => uploadVideo({ mapId: 'm', file: video(), uploadRules: rules, ...args });

  it('a locked map, and a map below First Class', async () => {
    await expect(refusal({ uploadRules: { locked: true, videos: rules.videos } })).rejects.toThrow(LOCKED_MAP);
    await expect(refusal({ uploadRules: { videos: null } })).rejects.toThrow(VIDEOS_ARE_FIRST_CLASS);
    await expect(refusal({ uploadRules: null })).rejects.toThrow(VIDEOS_ARE_FIRST_CLASS);
  });

  it('a file that isn’t MP4 or MOV', async () => {
    await expect(refusal({ file: video({ type: 'video/webm', name: 'a.webm' }) })).rejects.toThrow('Only MP4 and MOV videos can be added.');
  });

  it('a file that’s too big, or empty', async () => {
    await expect(refusal({ file: video({ size: 500 * MB + 1 }) })).rejects.toThrow('This video is over 500 MB, the largest a video can be.');
    await expect(refusal({ file: video({ size: 0 }) })).rejects.toThrow('This video is empty.');
  });

  it('a country that’s full', async () => {
    await expect(refusal({ countryCode: 'IT', videoCount: 20 })).rejects.toThrow('20 of 20 videos of Italy on this map.');
    expect(readVideoInfo).not.toHaveBeenCalled();
  });

  it('a video longer than the longest, by its boxes', async () => {
    readVideoInfo.mockResolvedValue({ seconds: 181, durationS: 181, recordedAt: null });
    await expect(refusal({})).rejects.toThrow('This video is over 3 minutes long, the longest a video can be.');
    expect(stripVideoLocation).not.toHaveBeenCalled();
  });

  it('a length it can’t read at all', async () => {
    readVideoInfo.mockResolvedValue({ seconds: null, durationS: null, recordedAt: null });
    readVideoElementLength.mockResolvedValue(null);
    await expect(refusal({})).rejects.toThrow('This video’s length couldn’t be read, so it wasn’t uploaded.');
    expect(readVideoElementLength).toHaveBeenCalledWith(cleaned);
    expect(startVideoUpload).not.toHaveBeenCalled();
  });

  it('a video the browser finds too long, worded in seconds when the limit isn’t whole minutes', async () => {
    readVideoInfo.mockResolvedValue({ seconds: null, durationS: null, recordedAt: null });
    readVideoElementLength.mockResolvedValue(95.5);
    await expect(refusal({ uploadRules: { videos: { ...rules.videos, maxSeconds: 90 } } })).rejects.toThrow(
      'This video is over 90 seconds long, the longest a video can be.',
    );
  });
});

describe('uploadVideo', () => {
  it('cleans the file, starts the upload, sends it to Stream and saves it', async () => {
    const stages = [];
    const onProgress = vi.fn();
    const file = video({ type: '', name: 'clip.MOV' });
    const result = await uploadVideo({ mapId: 'm', tripId: 't', file, countryCode: 'IT', uploadRules: rules, videoCount: 3, onStage: (s) => stages.push(s), onProgress });

    expect(result).toEqual({ photo: { id: 'v1', videoState: 'PROCESSING' } });
    expect(stages).toEqual(['reading', 'cleaning', 'uploading', 'saving']);
    expect(stripVideoLocation).toHaveBeenCalledWith(file, { type: 'video/quicktime' });
    expect(startVideoUpload).toHaveBeenCalledWith('m', { bytes: 4000, contentType: 'video/quicktime', durationS: 42, tripId: 't', countryCode: 'IT' });
    expect(sendToStream).toHaveBeenCalledWith(cleaned, 'https://upload.example/tus/1', { onProgress });
    expect(saveVideo).toHaveBeenCalledWith('m', { ticket: 'ticket-1', countryCode: 'IT', takenAt: '2025-06-14T09:00:00.000Z' });
    expect(readVideoElementLength).not.toHaveBeenCalled();
  });

  it('takes the browser’s length when the boxes don’t say, rounded up', async () => {
    readVideoInfo.mockResolvedValue({ seconds: null, durationS: null, recordedAt: null });
    readVideoElementLength.mockResolvedValue(0.3);
    await uploadVideo({ mapId: 'm', file: video(), uploadRules: rules });
    expect(startVideoUpload).toHaveBeenCalledWith('m', { bytes: 4000, contentType: 'video/mp4', durationS: 1, tripId: undefined, countryCode: undefined });
    expect(saveVideo).toHaveBeenCalledWith('m', { ticket: 'ticket-1', countryCode: undefined, takenAt: undefined });
  });

  it('uses the standard limits when the rules leave them out', async () => {
    readVideoInfo.mockResolvedValue({ seconds: 200, durationS: 200, recordedAt: null });
    await expect(uploadVideo({ mapId: 'm', file: video(), uploadRules: { videos: {} } })).rejects.toThrow('over 3 minutes');
  });
});
