// A video's poster frames (docs/API.md, "Videos"): its THUMB (~400 px) and DISPLAY
// (~1600 px) are a frame about a second in, drawn onto a canvas and encoded as a photo's
// copies are (makePhotoCopies.js), so they carry no metadata. Many browsers can't decode
// an iPhone's HEVC: when no frame can be drawn (an error, no picture, or a timeout), a
// paperwork-style card stands in (a film-reel stamp and the length), never a failed upload.
import { DISPLAY_EDGE, THUMB_EDGE, encode } from './makePhotoCopies';
import { formatVideoLength } from './videoLength';

const FRAME_AT_SECONDS = 1;
const FRAME_TIMEOUT_MS = 10_000;

/**
 * A frame of the video on a canvas: `{ canvas, width, height, seconds }` (`seconds` is
 * the length the browser read, or null). Rejects when the browser can't draw one.
 */
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
      // Sound but no picture: what some browsers do with a video codec they lack
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
          finish({ canvas, width: canvas.width, height: canvas.height, seconds: Number.isFinite(video.duration) ? video.duration : null });
        } catch (err) {
          finish(null, err);
        }
      },
      { once: true },
    );
    video.src = url;
  });
}

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

// The paperwork colours (index.css poster-* tokens, the same in every theme)
function token(name, fallback) {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  } catch {
    return fallback;
  }
}

/** The stand-in poster: a cream card on parchment, a red film-reel stamp, and the length. */
function drawPlaceholder(seconds) {
  const width = 1600;
  const height = 900;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const paper = token('--poster-paper', 'tan');
  const cream = token('--poster-cream', 'ivory');
  const red = token('--poster-red', 'firebrick');
  const brown = token('--poster-brown', 'saddlebrown');
  const ink = token('--poster-ink', 'black');

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = cream;
  ctx.fillRect(60, 60, width - 120, height - 120);
  ctx.setLineDash([18, 12]);
  ctx.strokeStyle = brown;
  ctx.lineWidth = 6;
  ctx.strokeRect(84, 84, width - 168, height - 168);
  ctx.setLineDash([]);

  // The film reel, inked like a rubber stamp and set down a little crooked
  ctx.save();
  ctx.translate(width / 2, 370);
  ctx.rotate(-0.08);
  ctx.strokeStyle = red;
  ctx.fillStyle = red;
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(0, 0, 190, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 214, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 12;
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 108, Math.sin(angle) * 108, 46, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.font = '600 72px Poppins, sans-serif';
  ctx.fillText(seconds ? `VIDEO · ${formatVideoLength(seconds)}` : 'VIDEO', width / 2, 720);
  return canvas;
}

/**
 * The poster frames of a video: `{ thumb, display, frame }`, each copy `{ blob, width,
 * height, contentType }`. `frame` is `{ width, height, seconds }` as the browser read the
 * video (the picture the right way up), or null when it couldn't and the stand-in card
 * was used. `seconds` labels that card.
 */
export async function makeVideoPosters(blob, { seconds = null } = {}) {
  const frame = await grabFrame(blob).catch(() => null);
  const source = frame ? frame.canvas : drawPlaceholder(seconds);
  const display = await encode(source, DISPLAY_EDGE, 0.82);
  const thumb = await encode(source, THUMB_EDGE, 0.75);
  return { thumb, display, frame: frame ? { width: frame.width, height: frame.height, seconds: frame.seconds } : null };
}
