import React, { useState, useMemo, useId } from 'react';
import PropTypes from 'prop-types';
import AppAnchor from './AppAnchor';

// Accessible image with ratio box, lazy load and fallback

export default function AppImage({
  src,
  alt,
  ratio,                  // "3/2", "16/9", "9/16", etc.
  width,
  height,
  sizes,
  srcSet,
  sources = [],
  loading,
  decoding = 'async',
  priority = false,
  fetchPriority,
  className = '',
  imgClassName = '',
  style,
  caption,
  figure = false,
  linkTo,
  target,
  rel,
  fallbackSrc,
  onLoad,
  onError,
  referrerPolicy = 'no-referrer',
  draggable = false,
}) {
  const [loaded, setLoaded] = useState(false);
  const [hadError, setHadError] = useState(false);

  if (import.meta.env.DEV) {
    if (!alt || !alt.trim()) {
      console.warn('[AppImage] `alt` is required and should be meaningful:', src);
    }
  }

  const finalLoading = priority ? 'eager' : (loading || 'lazy');
  const finalFetchPriority = priority ? 'high' : (fetchPriority || undefined);
  const displaySrc = hadError && fallbackSrc ? fallbackSrc : src;

  // Aspect ratio for the wrapper element (prevents CLS)
  const aspectStyle = ratio
    ? { aspectRatio: ratio.replace(':', '/') }
    : (width && height ? { aspectRatio: `${width} / ${height}` } : {});

  const figcapId = useId();
  const hasCaption = Boolean(caption);
  const wrapperIsFigure = figure || hasCaption;

  const Picture = useMemo(() => {
    const imgProps = {
      src: displaySrc,
      alt,
      decoding,
      draggable,
      referrerPolicy,
      loading: finalLoading,
      ...(sizes ? { sizes } : {}),
      ...(srcSet ? { srcSet } : {}),
      // fetchPriority (if set)
      ...(finalFetchPriority ? { fetchPriority: finalFetchPriority } : {}),
      ...(hasCaption ? { 'aria-describedby': figcapId } : {}),
      className: [
        'block w-full h-auto',
        loaded || hadError ? 'blur-0 opacity-100' : 'blur-sm opacity-80 animate-pulse',
        imgClassName || '',
      ].join(' ').trim(),
      onLoad: (e) => { setLoaded(true); onLoad && onLoad(e); },
      // Already in the cache (pre-rendered page, back navigation): no blur frame
      ref: (node) => { if (node?.complete && node.naturalWidth > 0) setLoaded(true); },
      onError: (e) => { if (!hadError && fallbackSrc) setHadError(true); else setHadError(true); onError && onError(e); },
    };

    // Explicit width/height (Lighthouse)
    if (width)  imgProps.width = width;
    if (height) imgProps.height = height;

    const Img = <img {...imgProps} />;

    if (!sources || sources.length === 0) return Img;

    return (
      <picture>
        {sources.map((s, idx) => (
          <source
            key={idx}
            {...(s.type ? { type: s.type } : {})}
            {...(s.media ? { media: s.media } : {})}
            {...(s.sizes ? { sizes: s.sizes } : {})}
            {...(s.srcSet ? { srcSet: s.srcSet } : {})}
          />
        ))}
        {Img}
      </picture>
    );
  }, [
    sources,
    displaySrc,
    alt,
    sizes,
    srcSet,
    finalLoading,
    decoding,
    finalFetchPriority,
    imgClassName,
    loaded,
    hadError,
    fallbackSrc,
    onLoad,
    onError,
    referrerPolicy,
    draggable,
    width,
    height,
    hasCaption,
    figcapId,
  ]);

  const WrapperTag = wrapperIsFigure ? 'figure' : 'div';

  const Wrapped = (
    <WrapperTag className={className} style={{ ...style, ...aspectStyle }}>
      {Picture}
      {hasCaption ? (
        <figcaption id={figcapId} className="text-sm leading-snug pt-2">
          {caption}
        </figcaption>
      ) : null}
    </WrapperTag>
  );

  if (linkTo) {
    return (
      <AppAnchor href={linkTo} target={target} rel={rel} className="block">
        {Wrapped}
      </AppAnchor>
    );
  }

  return Wrapped;
}

AppImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  ratio: PropTypes.string, // e.g. "3/2", "16/9", "9/16"
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  sizes: PropTypes.string,
  srcSet: PropTypes.string,
  sources: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string,
    media: PropTypes.string,
    sizes: PropTypes.string,
    srcSet: PropTypes.string,
  })),
  loading: PropTypes.oneOf(['lazy', 'eager']),
  decoding: PropTypes.oneOf(['async', 'auto', 'sync']),
  priority: PropTypes.bool,
  fetchPriority: PropTypes.oneOf(['high', 'low', 'auto']),
  className: PropTypes.string,
  imgClassName: PropTypes.string,
  style: PropTypes.object,
  caption: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  figure: PropTypes.bool,
  linkTo: PropTypes.string,
  target: PropTypes.string,
  rel: PropTypes.string,
  fallbackSrc: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  referrerPolicy: PropTypes.string,
  draggable: PropTypes.bool,
};
