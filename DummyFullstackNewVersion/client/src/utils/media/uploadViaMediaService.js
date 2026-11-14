import axios from 'axios';
// Api
import client from '@/api/client';
import { PRESIGN_UPLOAD_API, CONFIRM_UPLOAD_API } from '@/utils/constants/apiRoutes';

// Presign, upload, then confirm a file via /media-services
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

  // 1) ask server for a signed PUT URL
  const presignResp = await client.post(
    PRESIGN_UPLOAD_API,
    {
      resource,
      filename: filename || file.name || 'upload.bin',
      contentType: mime,
    },
    true // AUTHENTICATED
  );

  const { url, key, maxBytes, publicUrl } = presignResp?.data || {};
  if (!url || !key) throw new Error('Presign failed: url/key not returned');

  // 2) upload the file directly (no cookies)
  await axios.put(url, file, {
    withCredentials: false,
    headers: { 'Content-Type': mime },
    onUploadProgress: (evt) => {
      if (!evt?.total || !onProgress) return;
      onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });

  // 3) confirm the real uploaded size server-side
  const confirmResp = await client.post(CONFIRM_UPLOAD_API, { key }, true);
  const bytes = confirmResp?.data?.bytes ?? file.size ?? 0;

  return {
    key,
    mimeType: mime,
    sizeBytes: bytes,
    publicUrl: publicUrl || null,
    maxBytes: maxBytes ?? null,
  };
}
