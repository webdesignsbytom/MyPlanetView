import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MOCK_CONVERT_MS,
  MOCK_STREAM_ORIGIN,
  answerTus,
  convertMockVideo,
  createMockStreamUpload,
  deleteMockStreamVideo,
  mockPlayback,
  mockStreamVideo,
} from '@/dev/mock/stream';
import { box, polyfillBlobReads, stubObjectUrls, videoBlob } from './mockApi';

polyfillBlobReads();

// A browser can't decode these made-up files: the thumbnails are the stand-in's
vi.mock('@/dev/mock/videoThumbnail', () => ({ makeMockThumbnails: vi.fn(async () => ({ thumb: 'blob:thumb', display: 'blob:display' })) }));

const PATCH_HEADERS = (offset) => ({ 'content-type': 'application/offset+octet-stream', 'upload-offset': String(offset) });
const clean = () => videoBlob(box('ftyp', 'isom'), box('moov', box('mvhd', new Uint8Array(8))));
const withLocation = () => videoBlob(box('ftyp', 'isom'), box('moov', new Uint8Array([0xa9, 0x78, 0x79, 0x7a])));

let objectUrls;
beforeEach(() => {
  objectUrls = stubObjectUrls();
});

describe('a tus upload', () => {
  it('makes an upload with its own address', () => {
    const { uid, uploadUrl } = createMockStreamUpload({ bytes: 10 });
    expect(uid).toMatch(/^[0-9a-f]{32}$/);
    expect(uploadUrl).toBe(`${MOCK_STREAM_ORIGIN}/tus/${uid}`);
    expect(MOCK_CONVERT_MS).toBe(4000);
    expect(mockStreamVideo(uid)).toEqual({ arrived: false, size: 0 });
  });

  it('answers 404 for an upload it doesn’t have, and 405 for a method tus doesn’t use', async () => {
    expect((await answerTus('HEAD', `${MOCK_STREAM_ORIGIN}/tus/nope`, {})).status).toBe(404);
    const { uploadUrl } = createMockStreamUpload({ bytes: 5 });
    expect((await answerTus('POST', uploadUrl, {})).status).toBe(405);
  });

  it('says how much has arrived on a HEAD', async () => {
    const { uploadUrl } = createMockStreamUpload({ bytes: 5 });
    const { status, headers } = await answerTus('HEAD', uploadUrl, {});
    expect(status).toBe(200);
    expect(headers).toMatchObject({ 'Tus-Resumable': '1.0.0', 'Upload-Offset': '0', 'Upload-Length': '5' });
  });

  it('refuses a piece of the wrong type, at the wrong offset or past the end', async () => {
    const { uploadUrl } = createMockStreamUpload({ bytes: 4 });
    expect((await answerTus('PATCH', uploadUrl, { 'content-type': 'video/mp4', 'upload-offset': '0' }, new Blob(['ab']))).status).toBe(415);
    expect((await answerTus('PATCH', uploadUrl, PATCH_HEADERS(0), 'ab')).status).toBe(415);
    expect((await answerTus('PATCH', uploadUrl, PATCH_HEADERS(2), new Blob(['ab']))).status).toBe(409);
    expect((await answerTus('PATCH', uploadUrl, PATCH_HEADERS(0), new Blob(['abcde']))).status).toBe(413);
  });

  it('takes a clean video in pieces, and has it once the last one is in', async () => {
    const file = clean();
    const { uid, uploadUrl } = createMockStreamUpload({ bytes: file.size });
    const first = await answerTus('PATCH', uploadUrl, PATCH_HEADERS(0), file.slice(0, 10));
    expect(first).toEqual({ status: 204, headers: { 'Tus-Resumable': '1.0.0', 'Upload-Offset': '10' } });
    expect(mockStreamVideo(uid).arrived).toBe(false);
    const last = await answerTus('PATCH', uploadUrl, PATCH_HEADERS(10), file.slice(10));
    expect(last.status).toBe(204);
    expect(mockStreamVideo(uid)).toEqual({ arrived: true, size: file.size });
  });

  it('refuses (403) a video that still holds a location, and starts it again from nothing', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const file = withLocation();
    const { uid, uploadUrl } = createMockStreamUpload({ bytes: file.size });
    expect((await answerTus('PATCH', uploadUrl, PATCH_HEADERS(0), file)).status).toBe(403);
    expect(mockStreamVideo(uid).arrived).toBe(false);
    expect((await answerTus('HEAD', uploadUrl, {})).headers['Upload-Offset']).toBe('0');
  });

  it('forgets a deleted upload', () => {
    const { uid } = createMockStreamUpload({ bytes: 1 });
    deleteMockStreamVideo(uid);
    expect(mockStreamVideo(uid)).toBeNull();
  });
});

describe('converting', () => {
  async function arrived(file) {
    const { uid, uploadUrl } = createMockStreamUpload({ bytes: file.size });
    await answerTus('PATCH', uploadUrl, PATCH_HEADERS(0), file);
    return uid;
  }

  it('does nothing for a video that hasn’t arrived', () => {
    const { uid } = createMockStreamUpload({ bytes: 10 });
    convertMockVideo(uid, { seconds: 3 });
    expect(mockPlayback(uid)).toBeNull();
  });

  it('serves a plain MP4 as it is, with its thumbnails', async () => {
    const uid = await arrived(clean());
    convertMockVideo(uid, { seconds: 3 });
    expect(mockPlayback(uid)).toEqual({ videoUrl: null, thumb: null, display: null });
    // The file is read asynchronously: wait for it, not a fixed tick (a busy machine took longer)
    await vi.waitFor(() => expect(mockPlayback(uid)).toEqual({ videoUrl: 'blob:mock/1', thumb: 'blob:thumb', display: 'blob:display' }));
  });

  it('serves a fragmented MP4 as a one-segment HLS playlist', async () => {
    const file = videoBlob(box('ftyp', 'isom'), box('moov', box('mvhd', new Uint8Array(8))), box('moof', new Uint8Array(4)), box('mdat', new Uint8Array(8)));
    const uid = await arrived(file);
    convertMockVideo(uid, { seconds: 2.5 });
    await vi.waitFor(() => expect(mockPlayback(uid).videoUrl).toMatch(/^blob:mock\/3#video\.m3u8$/));
    const playlist = await objectUrls[2].text();
    expect(playlist.split('\n')).toEqual([
      '#EXTM3U',
      '#EXT-X-VERSION:7',
      '#EXT-X-PLAYLIST-TYPE:VOD',
      '#EXT-X-TARGETDURATION:3',
      '#EXT-X-MEDIA-SEQUENCE:0',
      '#EXT-X-MAP:URI="blob:mock/1"',
      '#EXTINF:2.500,',
      'blob:mock/2',
      '#EXT-X-ENDLIST',
    ]);
    // The map is the start (ftyp and moov), the segment the fragments
    expect(objectUrls[0].size + objectUrls[1].size).toBe(file.size);
  });
});
