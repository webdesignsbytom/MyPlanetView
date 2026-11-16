import { useEffect, useRef } from 'react';

// A video's link (docs/API.md "Videos") is Cloudflare Stream's HLS playlist (`….m3u8`).
// Safari and some phones play HLS themselves; elsewhere hls.js (its light build, loaded
// only then) feeds the same <video> through Media Source Extensions. Any other link (a
// plain MP4: mock mode's files) is played as it is.
export const isHlsUrl = (url) => /\.m3u8(?:[?#]|$)/i.test(String(url || ''));
const canPlayHlsNatively = (video) => Boolean(video.canPlayType('application/vnd.apple.mpegurl'));

/**
 * Attach `url` to the <video> in `videoRef`. `onFail()` runs when it can't be played (hls.js
 * missing or unsupported, or a fatal error it couldn't recover from); the element's own
 * error and "no picture" cases stay with the component. How it's playing ('native' or
 * 'hls') is set as the element's `data-playback`, for the tests.
 */
export default function useVideoSource(videoRef, url, onFail) {
  const onFailRef = useRef(onFail);
  useEffect(() => {
    onFailRef.current = onFail;
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return undefined;
    let cancelled = false;
    let hls = null;
    const fail = () => {
      if (!cancelled) onFailRef.current?.();
    };
    const use = (mode) => {
      video.dataset.playback = mode;
    };

    if (!isHlsUrl(url) || canPlayHlsNatively(video)) {
      use('native');
      video.src = url;
    } else {
      import('hls.js/light').then(
        ({ default: Hls }) => {
          if (cancelled) return;
          if (!Hls.isSupported()) {
            fail();
            return;
          }
          hls = new Hls({ capLevelToPlayerSize: true });
          let recovered = false;
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            // A decoding hiccup can usually be recovered from once
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recovered) {
              recovered = true;
              hls.recoverMediaError();
              return;
            }
            fail();
          });
          use('hls');
          hls.loadSource(url);
          hls.attachMedia(video);
        },
        () => fail(),
      );
    }

    return () => {
      cancelled = true;
      hls?.destroy();
      delete video.dataset.playback;
      video.removeAttribute('src');
      video.load();
    };
  }, [videoRef, url]);
}
