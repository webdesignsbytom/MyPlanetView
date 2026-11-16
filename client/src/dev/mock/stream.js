// Mock mode only. A stand-in for Cloudflare Stream (docs/API.md "Videos"), kept in the
// browser for the session, like the mock bucket's files:
// - the resumable (tus) upload a video is sent to: HEAD says how much has arrived, each
//   PATCH adds a piece at that offset (mockXhr.js routes the requests here);
// - a few seconds of "converting" once it's saved (views.js videoStateOf), then
// - its playback link and thumbnails. A browser's own recording (a fragmented MP4, as the
//   e2e tests make) is served as an HLS playlist, as Stream serves every video, so hls.js
//   really plays it; any other file is served as it is.
// Stricter than Stream, like the mock bucket: a file still holding a location is refused.
import { videoStillHasLocation } from './uploads';
import { makeMockThumbnails } from './videoThumbnail';

export const MOCK_STREAM_ORIGIN = 'https://mock-stream.myplanetview.local';
// How long the mock takes to "convert" a saved video
export const MOCK_CONVERT_MS = 4000;

const TUS = { 'Tus-Resumable': '1.0.0' };
// uid -> { bytes, parts, received, blob }
const uploads = new Map();
// uid -> { videoUrl, thumb, display } once saved
const playback = new Map();

const uidOf = (url) => new URL(url).pathname.split('/').pop();

/** A new upload of `bytes`, as the server's createDirectUpload. -> `{ uid, uploadUrl }` */
export function createMockStreamUpload({ bytes }) {
  const uid = crypto.randomUUID().replaceAll('-', '');
  uploads.set(uid, { bytes, parts: [], received: 0, blob: null });
  return { uid, uploadUrl: `${MOCK_STREAM_ORIGIN}/tus/${uid}` };
}

/**
 * Stream's answer to a tus request (`headers` with lower-case names). -> `{ status, headers }`
 */
export async function answerTus(method, url, headers, body) {
  const upload = uploads.get(uidOf(url));
  if (!upload) return { status: 404, headers: TUS };
  if (method === 'HEAD') {
    return { status: 200, headers: { ...TUS, 'Upload-Offset': String(upload.received), 'Upload-Length': String(upload.bytes), 'Cache-Control': 'no-store' } };
  }
  if (method !== 'PATCH') return { status: 405, headers: TUS };
  if (headers['content-type'] !== 'application/offset+octet-stream' || !(body instanceof Blob)) return { status: 415, headers: TUS };
  if (Number(headers['upload-offset']) !== upload.received) return { status: 409, headers: TUS };
  if (upload.received + body.size > upload.bytes) return { status: 413, headers: TUS };
  upload.parts.push(body);
  upload.received += body.size;
  if (upload.received === upload.bytes) {
    const blob = new Blob(upload.parts);
    upload.parts = [];
    if (await videoStillHasLocation(blob)) {
      console.warn('[mock stream] 403: this video still holds a location (or has no movie box to check)');
      upload.received = 0;
      return { status: 403, headers: TUS };
    }
    upload.blob = blob;
  }
  return { status: 204, headers: { ...TUS, 'Upload-Offset': String(upload.received) } };
}

/** As Stream's GET of a video: null (no such upload), else `{ arrived, size }`. */
export function mockStreamVideo(uid) {
  const upload = uploads.get(uid);
  return upload ? { arrived: Boolean(upload.blob), size: upload.blob?.size ?? 0 } : null;
}

/** Forget an upload (a refused save, as the server deletes the Stream video). */
export function deleteMockStreamVideo(uid) {
  uploads.delete(uid);
  playback.delete(uid);
}

// The top-level boxes of an MP4, until the first movie fragment: -> its offset, or -1
async function firstFragmentAt(blob) {
  let at = 0;
  while (at + 8 <= blob.size) {
    const head = new DataView(await blob.slice(at, at + 16).arrayBuffer());
    let size = head.getUint32(0);
    if (size === 1) size = Number(head.getBigUint64(8));
    else if (size === 0) size = blob.size - at;
    const type = String.fromCharCode(head.getUint8(4), head.getUint8(5), head.getUint8(6), head.getUint8(7));
    if (type === 'moof') return at;
    if (size < 8) return -1;
    at += size;
  }
  return -1;
}

// A fragmented MP4 as a one-segment HLS playlist: its start (ftyp and moov) is the
// playlist's map, the fragments its segment. `#video.m3u8` marks the link as HLS, as
// Stream's `…/manifest/video.m3u8` is (the part after # never reaches the request).
async function playbackUrl(blob, seconds) {
  const at = await firstFragmentAt(blob);
  if (at <= 0) return URL.createObjectURL(blob);
  const init = URL.createObjectURL(blob.slice(0, at, 'video/mp4'));
  const media = URL.createObjectURL(blob.slice(at, blob.size, 'video/mp4'));
  const playlist = [
    '#EXTM3U',
    '#EXT-X-VERSION:7',
    '#EXT-X-PLAYLIST-TYPE:VOD',
    `#EXT-X-TARGETDURATION:${Math.max(1, Math.ceil(seconds))}`,
    '#EXT-X-MEDIA-SEQUENCE:0',
    `#EXT-X-MAP:URI="${init}"`,
    `#EXTINF:${Number(seconds).toFixed(3)},`,
    media,
    '#EXT-X-ENDLIST',
  ].join('\n');
  return `${URL.createObjectURL(new Blob([playlist], { type: 'application/vnd.apple.mpegurl' }))}#video.m3u8`;
}

/**
 * Start "converting" a saved upload: its playback link and thumbnails, made in the
 * background (the save doesn't wait).
 */
export function convertMockVideo(uid, { seconds }) {
  const upload = uploads.get(uid);
  if (!upload?.blob) return;
  const entry = { videoUrl: null, thumb: null, display: null };
  playback.set(uid, entry);
  playbackUrl(upload.blob, seconds).then((url) => {
    entry.videoUrl = url;
  });
  makeMockThumbnails(upload.blob).then((thumbs) => {
    if (!thumbs) return;
    entry.thumb = thumbs.thumb;
    entry.display = thumbs.display;
  });
}

/** A converted video's links, for this session: `{ videoUrl, thumb, display }` or null. */
export const mockPlayback = (uid) => playback.get(uid) || null;
