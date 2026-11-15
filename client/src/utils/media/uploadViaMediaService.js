// Api
import client from '@/api/client';
import { PRESIGN_UPLOAD_API, CONFIRM_UPLOAD_API } from '@/utils/constants/apiRoutes';
import { putFile } from '@/utils/photos/putFile';

// Presign, upload, then confirm a file via /media-services (avatars, contact images).
// The upload URL is signed for the declared Content-Type and byte size, so the PUT
// sends exactly that type and the same file (docs/API.md, "Generic uploads").
export async function presignAndUpload({
  resource,        // e.g. 'avatar', 'contact'
  file,            // File/Blob
  filename,        // suggested original filename (string)
  contentType,     // optional override; default file.type
  onProgress,      // optional (pct:number) => void
}) {
  if (!file) throw new Error('No file provided');
  if (!resource) throw new Error('Missing resource prefix');

  const mime = contentType || file.type || 'application/octet-stream';
  const bytes = file.size;

  // 1) ask server for a signed PUT URL
  const presignResp = await client.post(
    PRESIGN_UPLOAD_API,
    {
      resource,
      filename: filename || file.name || undefined,
      contentType: mime,
      bytes,
    },
    true // AUTHENTICATED
  );

  const { url, key, maxBytes, publicUrl } = presignResp?.data || {};
  if (!url || !key) throw new Error('Presign failed: url/key not returned');

  // 2) upload the file directly (no cookies), exactly as declared
  const reportPercent = onProgress
    ? (loaded) => onProgress(bytes ? Math.round((loaded / bytes) * 100) : 100)
    : undefined;
  await putFile(url, file, mime, reportPercent, bytes);

  // 3) the server checks the real type and size in the bucket
  const confirmResp = await client.post(CONFIRM_UPLOAD_API, { key }, true);
  const confirmedBytes = confirmResp?.data?.bytes ?? bytes;

  return {
    key,
    mimeType: mime,
    sizeBytes: confirmedBytes,
    publicUrl: publicUrl || null,
    maxBytes: maxBytes ?? null,
  };
}
