// Mock mode only. Cloudflare Stream makes a video's thumbnails (docs/API.md "Videos"); the
// mock's stand-in draws a frame about a second in onto a canvas, as Stream's
// `thumbnail.jpg?time=1s` does, at its two sizes (400 and 1,080 px). A file this browser
// can't decode (an iPhone's HEVC in Chrome, the tests' made-up MP4s) has none, as a real
// video whose frame Stream couldn't draw would show its card instead.
import { encode } from '@/utils/photos/makePhotoCopies';

const FRAME_AT_SECONDS = 1;
const FRAME_TIMEOUT_MS = 10_000;

// A frame the browser couldn't decode is left transparent (a dark frame is still a frame)
function drewSomething(canvas) {
  const probe = document.createElement('canvas');
  probe.width = 16;
  probe.height = 16;
  const ctx = probe.getContext('2d');
  ctx.drawImage(canvas, 0, 0, 16, 16);
  const { data } = ctx.getImageData(0, 0, 16, 16);
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
  return false;
}

/** A frame of the video on a canvas, with its size; rejects when the browser can't draw one. */
function grabFrame(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    let settled = false;
    const finish = (result, error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      if (error) reject(error);
      else resolve(result);
    };
    const timer = window.setTimeout(() => finish(null, new Error('No frame in time')), FRAME_TIMEOUT_MS);

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.addEventListener('error', () => finish(null, new Error('The browser can’t decode this video')));
    video.addEventListener('loadedmetadata', () => {
      if (!video.videoWidth || !video.videoHeight) {
        finish(null, new Error('No picture'));
        return;
      }
      const length = Number.isFinite(video.duration) ? video.duration : null;
      video.currentTime = length ? Math.min(FRAME_AT_SECONDS, length / 2) : FRAME_AT_SECONDS;
    });
    video.addEventListener(
      'seeked',
      () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          if (!drewSomething(canvas)) throw new Error('Nothing was drawn');
          finish({ canvas, width: canvas.width, height: canvas.height });
        } catch (err) {
          finish(null, err);
        }
      },
      { once: true },
    );
    video.src = url;
  });
}

/**
 * -> `{ thumb, display, width, height }` (two blob URLs and the picture's size), or null
 * when no frame could be drawn.
 */
export async function makeMockThumbnails(blob) {
  const frame = await grabFrame(blob).catch(() => null);
  if (!frame) return null;
  const [thumb, display] = await Promise.all([encode(frame.canvas, 400, 0.75), encode(frame.canvas, 1080, 0.82)]);
  return { thumb: URL.createObjectURL(thumb.blob), display: URL.createObjectURL(display.blob), width: frame.width, height: frame.height };
}
