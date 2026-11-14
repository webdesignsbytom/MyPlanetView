import React, { useMemo } from 'react';
import { Link as HeadLink } from 'react-head';
import AppImage from './AppImage';
import { getImageSets } from '@/lib/media/imageManifest';

// Responsive image from /src/assets/images/<folder>/<name>
export default function ResponsiveImage({
  folder,
  name,
  ratio,
  width,
  height,
  alt,
  sizes,
  priority,
  className,
  imgClassName,
  fallbackSrc,
}) {
  if (import.meta.env.DEV) {
    if (!folder) console.warn('[ResponsiveImage] Missing required "folder" prop.');
    if (!name) console.warn('[ResponsiveImage] Missing required "name" prop.');
  }

  const sets = useMemo(
    () =>
      folder && name
        ? getImageSets(name, { dir: `/src/assets/images/${folder}` })
        : {},
    [folder, name]
  );

  // Prefer AVIF → WebP → JPG for the <img src> (helps LCP)
  const defaultSrc =
    sets?.pick?.('avif', 1200) ||
    sets?.pick?.('webp', 1200) ||
    sets?.pick?.('jpg', 1200);

  const sources = [
    sets?.avifSet ? { type: 'image/avif', srcSet: sets.avifSet, sizes } : null,
    sets?.webpSet ? { type: 'image/webp', srcSet: sets.webpSet, sizes } : null,
  ].filter(Boolean);

  // Auto-preload when priority=true (AVIF first, else WebP)
  const preloadSet = sets?.avifSet || sets?.webpSet;
  const preloadType = sets?.avifSet
    ? 'image/avif'
    : sets?.webpSet
    ? 'image/webp'
    : undefined;
  const preloadSizes = sizes || '100vw';

  return (
    <>
      {priority && preloadSet && preloadType ? (
        <HeadLink
          rel="preload"
          as="image"
          imageSrcSet={preloadSet}
          imageSizes={preloadSizes}
          type={preloadType}
        />
      ) : null}

      <AppImage
        src={defaultSrc}
        alt={alt}
        ratio={ratio}
        width={width}
        height={height}
        sizes={sizes}
        srcSet={sets?.jpgSet}
        sources={sources}
        priority={priority}
        className={className}
        imgClassName={imgClassName}
        fallbackSrc={fallbackSrc || sets?.pick?.('jpg', 800)}
      />
    </>
  );
}
