import React, { useRef, useState } from 'react';
// Icons
import { FaDownload, FaFilm } from 'react-icons/fa';
// Components
import Button from '@/components/common/Button';
// Hooks
import useVideoSource, { isHlsUrl } from '@/hooks/useVideoSource';
// Utils
import { spokenVideoLength } from '@/utils/photos/videoLength';

const FRAME = 'max-h-[70vh] w-full border-8 border-poster-cream bg-poster-cream object-contain shadow-paper';
const CARD = 'grid min-h-48 content-center justify-items-center gap-3 border-8 border-poster-cream bg-poster-cream p-6 text-center text-poster-ink shadow-paper';

/** A video still being converted, or one Cloudflare couldn't convert (editors only see these). */
function VideoStateCard({ state, checking, onRefresh }) {
  const failed = state === 'FAILED';
  return (
    <figure className={CARD} role='status'>
      <FaFilm aria-hidden='true' className={`text-4xl ${failed ? 'text-status-critical' : 'text-poster-red'}`} />
      <p className='font-travel text-xl'>{failed ? 'This video couldn’t be prepared' : 'Getting this video ready'}</p>
      <p className='max-w-prose text-sm'>
        {failed
          ? 'Cloudflare couldn’t convert this file, so it can’t play. Delete it, then add the file again or another one.'
          : 'Cloudflare is converting it so every browser can play it. This usually takes a minute or two, and this page checks again by itself.'}
      </p>
      {!failed && onRefresh ? (
        <Button quiet busy={checking} onClick={onRefresh}>
          Check now
        </Button>
      ) : null}
    </figure>
  );
}

/**
 * A video in the photo viewer (docs/API.md, "Videos"). A ready one plays from Cloudflare
 * Stream's HLS link (useVideoSource: the browser's own HLS, else hls.js) over its poster
 * frame. One still converting, or that failed, shows a card saying so (`onRefresh` asks
 * again). If this browser can't play it after all, it says so; a plain file (mock mode)
 * is offered to download instead.
 */
function VideoPlayer({ photo, checking = false, onRefresh }) {
  const videoRef = useRef(null);
  const [failedUrl, setFailedUrl] = useState(null);
  const failed = !photo.videoUrl || failedUrl === photo.videoUrl;
  const fail = () => setFailedUrl(photo.videoUrl);
  useVideoSource(videoRef, failed ? null : photo.videoUrl, fail);

  if (photo.videoState === 'PROCESSING' || photo.videoState === 'FAILED') {
    return <VideoStateCard state={photo.videoState} checking={checking} onRefresh={onRefresh} />;
  }

  if (failed) {
    return (
      <figure className='grid gap-2'>
        {photo.displayUrl ? <img src={photo.displayUrl} alt='' className={FRAME} /> : null}
        <figcaption role='status' className='grid justify-items-start gap-2 text-sm'>
          <span className='font-medium'>This browser can’t play this video.</span>
          {photo.videoUrl && !isHlsUrl(photo.videoUrl) ? (
            <a
              href={photo.videoUrl}
              download
              target='_blank'
              rel='noreferrer'
              className='btn-paper grid grid-cols-reg items-center gap-2 [--btn-leading:1.5rem] [--btn-pad-x:1rem] [--btn-pad-y:0.375rem] [--btn-size:1.125rem]'
            >
              <FaDownload aria-hidden='true' />
              Download to watch
            </a>
          ) : (
            <span>Try it in another browser, or on another device.</span>
          )}
        </figcaption>
      </figure>
    );
  }

  return (
    <video
      key={photo.videoUrl}
      ref={videoRef}
      poster={photo.displayUrl || undefined}
      controls
      playsInline
      preload='metadata'
      aria-label={photo.durationS ? `Video, ${spokenVideoLength(photo.durationS)}` : 'Video'}
      onError={fail}
      // Sound but no picture: a video codec this browser lacks
      onLoadedMetadata={(e) => {
        if (!e.currentTarget.videoWidth) fail();
      }}
      className={FRAME}
    />
  );
}

export default VideoPlayer;
