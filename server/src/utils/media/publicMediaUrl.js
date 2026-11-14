export const publicMediaUrlFrom = (objectKey) => {
  if (!objectKey) return '';

  // Public read host (matches client VITE_MEDIA_CDN)
  const publicHost = process.env.STORAGE_PUBLIC_HOST;
  if (publicHost) return `${publicHost.replace(/\/$/, '')}/${objectKey}`;

  const endpoint = process.env.STORAGE_ENDPOINT;
  const bucket = process.env.STORAGE_BUCKET;

  return `${endpoint}/${bucket}/${objectKey}`;
};