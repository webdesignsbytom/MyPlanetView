import React, { useState } from 'react';
// Icons
import { FaDownload } from 'react-icons/fa';
// Utils
import { spokenVideoLength } from '@/utils/photos/videoLength';

const FRAME = 'max-h-[70vh] w-full border-8 border-poster-cream bg-poster-cream object-contain shadow-paper';

/**
 * A video in the photo viewer (docs/API.md, "Videos"): the browser's own player over its
 * poster frame. iPhones record HEVC, which some browsers can't play: the element then
 * fails (an error), or plays the sound with no picture. Either way it says so and offers
 * the file to download instead.
 */
function VideoPlayer({ photo }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const failed = !photo.videoUrl || failedUrl === photo.videoUrl;
  const fail = () => setFailedUrl(photo.videoUrl);

  if (failed) {
    return (
      <figure className='grid gap-2'>
        {photo.displayUrl ? <img src={photo.displayUrl} alt='' className={FRAME} /> : null}
        <figcaption role='status' className='grid justify-items-start gap-2 text-sm'>
          <span className='font-medium'>This browser can’t play this video.</span>
          {photo.videoUrl ? (
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
          ) : null}
        </figcaption>
      </figure>
    );
  }

  return (
    <video
      key={photo.videoUrl}
      src={photo.videoUrl}
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
