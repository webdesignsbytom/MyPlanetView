// Sending a video's file to Cloudflare Stream (docs/API.md "Videos"). The server starts a
// resumable (tus) upload for it and hands back `uploadUrl`, which needs no credentials;
// this sends the file there in pieces, and after a dropped connection asks Stream how far
// it got and carries on from there. tus-js-client loads only when a video is sent.

// Stream wants every piece but the last to be a multiple of 256 KiB and at least 5 MB;
// it suggests 50 MB
export const STREAM_CHUNK_BYTES = 50 * 1024 * 1024;
// Waits before each new try after a failure (a network error, or Stream's 5xx, 409 or 423)
const RETRY_DELAYS_MS = [0, 3000, 10000, 30000, 60000];

export const STREAM_UPLOAD_FAILED = 'The video couldn’t be sent. Check your connection and try again.';

/**
 * Send `blob` to the tus upload at `uploadUrl`. onProgress(0..1, { sent, total }) in bytes.
 * Resolves once Stream has the whole file; rejects with a message people can read.
 */
export async function sendToStream(blob, uploadUrl, { onProgress } = {}) {
  const { Upload } = await import('tus-js-client');
  return new Promise((resolve, reject) => {
    const upload = new Upload(blob, {
      uploadUrl,
      chunkSize: STREAM_CHUNK_BYTES,
      retryDelays: RETRY_DELAYS_MS,
      // The server made this upload for this file: nothing to look up or remember
      storeFingerprintForResuming: false,
      removeFingerprintOnSuccess: true,
      onProgress: (sent, total) => onProgress?.(total ? sent / total : 0, { sent, total }),
      onSuccess: () => resolve(),
      onError: (err) => {
        console.warn('[video upload]', err?.message || err);
        reject(new Error(STREAM_UPLOAD_FAILED));
      },
    });
    upload.start();
  });
}
