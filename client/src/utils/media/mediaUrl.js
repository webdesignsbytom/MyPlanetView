// Public media (the country posters, avatars, contact images) lives in the public
// bucket, at VITE_MEDIA_CDN. In development without it, the files come from the repo's
// media/ folder, which mirrors the bucket and is served at /local-media (vite.config.js).
const CDN_BASE = import.meta.env.VITE_MEDIA_CDN || (import.meta.env.DEV ? '/local-media' : '');

// Resolve an object key to a full media URL
export function mediaUrlFrom({ objectKey }) {
  if (!objectKey) return '#';

  // Already a full URL (e.g. starts with http:// or https://)
  if (/^https?:\/\//i.test(objectKey)) {
    return objectKey;
  }

  const key = String(objectKey).replace(/^\/+/, '');
  if (CDN_BASE) {
    return `${CDN_BASE.replace(/\/+$/, '')}/${key}`;
  }

  // Fallback if nothing else available
  return `#`;
}
