// A video's length as the browser reads it, for the files whose boxes don't say (some
// fragmented MP4s, such as a browser's own recordings): the uploader needs it before the
// upload starts (docs/API.md "Videos"). A recording can report an endless length until
// the browser has looked at its end, so it seeks there first.

const TIMEOUT_MS = 10_000;

/** -> the length in seconds, or null when this browser can't read it (an HEVC file, say). */
export function readVideoElementLength(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    let settled = false;
    const finish = (seconds) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(seconds) && seconds > 0 ? seconds : null);
    };
    const timer = window.setTimeout(() => finish(null), TIMEOUT_MS);
    const read = () => {
      if (Number.isFinite(video.duration)) finish(video.duration);
    };

    video.muted = true;
    video.preload = 'metadata';
    video.addEventListener('error', () => finish(null));
    video.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(video.duration)) {
        finish(video.duration);
        return;
      }
      video.addEventListener('durationchange', read);
      video.addEventListener('seeked', read, { once: true });
      video.currentTime = Number.MAX_SAFE_INTEGER;
    });
    video.src = url;
  });
}
