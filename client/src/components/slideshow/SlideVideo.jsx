import React, { useEffect, useRef, useState } from 'react';
// Icons
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
// Components
import SlidePhoto from './SlidePhoto';
// Hooks
import useVideoSource from '@/hooks/useVideoSource';

/**
 * One video of a slideshow (docs/FEATURE-PLAN.md, "Videos": "in slideshows, playing
 * through, then moving on"). It plays and pauses with the show (`playing`), muted until
 * the sound button is pressed (`muted`, kept by the show for the videos after it), and
 * calls `onEnded(id)` when it has played through, which moves the show on instead of
 * its timer. A video this browser can't play (an error, or sound with no picture, as
 * with HEVC where the device can't decode it) shows its poster frame as a photo for the
 * usual time instead: `onFailed(id)`. It plays from Cloudflare Stream's HLS link
 * (useVideoSource). Keyed by the photo by its parent.
 */
function SlideVideo({ photo, alt, playing, muted, onMutedChange, reducedMotion, onReady, onEnded, onFailed }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(!photo.videoUrl);
  const fail = () => setFailed(true);
  useVideoSource(videoRef, failed ? null : photo.videoUrl, fail);

  useEffect(() => {
    if (failed) onFailed(photo.id);
  }, [failed, onFailed, photo.id]);

  // Plays and pauses with the show. Sound on may be refused without a recent press:
  // then it plays muted.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    video.muted = muted;
    if (!playing) {
      video.pause();
      return;
    }
    video.play().catch((err) => {
      if (err?.name !== 'NotAllowedError' || video.muted) return;
      onMutedChange(true);
      video.muted = true;
      video.play().catch(() => {});
    });
  }, [playing, muted, failed, onMutedChange]);

  if (failed) return <SlidePhoto photo={photo} alt={alt} reducedMotion={reducedMotion} onReady={onReady} />;

  return (
    <>
      <video
        ref={videoRef}
        poster={photo.displayUrl || undefined}
        muted={muted}
        playsInline
        preload='auto'
        aria-label={alt}
        onLoadedData={() => onReady(photo.id)}
        onEnded={() => onEnded(photo.id)}
        onError={fail}
        onLoadedMetadata={(e) => {
          if (!e.currentTarget.videoWidth) fail();
        }}
        className='max-h-full max-w-full select-none border-4 border-poster-cream bg-poster-cream object-contain shadow-paper sm:border-8'
      />
      <button
        type='button'
        onClick={() => onMutedChange(!muted)}
        aria-label={muted ? 'Turn the sound on' : 'Turn the sound off'}
        className='absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full border-2 border-poster-brown bg-poster-cream text-lg text-poster-ink shadow-paper focus-visible:outline-2 focus-visible:outline-offset-2 sm:bottom-8 sm:right-8'
      >
        {muted ? <FaVolumeMute aria-hidden='true' /> : <FaVolumeUp aria-hidden='true' />}
      </button>
    </>
  );
}

export default SlideVideo;
