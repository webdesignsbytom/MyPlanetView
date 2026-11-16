import React, { useState } from 'react';

// The photo fades in, then drifts slowly closer while it's up (a gentle zoom), unless the
// viewer asked for less motion: then it simply cuts to the next.
const MOTION = { transition: 'opacity 600ms ease-out, transform 9s linear' };

/**
 * One photo of a slideshow, as large as the stage allows, on its white photo border.
 * `onReady` runs once it has loaded (or failed), so its time on screen starts then.
 * Keyed by the photo by its parent, so each photo starts from its own fade.
 */
function SlidePhoto({ photo, alt, reducedMotion, onReady }) {
  const [loaded, setLoaded] = useState(false);
  const done = () => {
    setLoaded(true);
    onReady(photo.id);
  };
  const motion = !reducedMotion;

  return (
    <img
      src={photo.displayUrl || photo.thumbUrl}
      alt={alt}
      decoding='async'
      draggable={false}
      onLoad={done}
      onError={done}
      // Already in the cache (it was preloaded): no load event may come
      ref={(node) => {
        if (node?.complete && node.naturalWidth > 0 && !loaded) done();
      }}
      style={motion ? MOTION : undefined}
      className={`max-h-full max-w-full select-none border-4 border-poster-cream bg-poster-cream object-contain shadow-paper sm:border-8 ${
        loaded ? `opacity-100 ${motion ? 'scale-[1.04]' : ''}` : motion ? 'opacity-0' : 'opacity-100'
      }`}
    />
  );
}

export default SlidePhoto;
