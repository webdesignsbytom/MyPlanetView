const CDN_BASE = import.meta.env.VITE_MEDIA_CDN;
// console.log('CDN BASE', CDN_BASE);
// Resolve an object key to a full media URL
export function mediaUrlFrom({ objectKey }) {
  if (!objectKey) return '#';

  // Already a full URL (e.g. starts with http:// or https://)
  if (/^https?:\/\//i.test(objectKey)) {
    return objectKey;
  }

  // Use your CDN base + objectKey
  const key = String(objectKey).replace(/^\/+/, '');
  if (CDN_BASE) {
    return `${CDN_BASE.replace(/\/+$/, '')}/${key}`;
  }

  // Fallback if nothing else available
  return `#`;
}
