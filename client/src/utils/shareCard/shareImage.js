// Handing a picture on (the share card): the phone's or computer's own share sheet where it
// takes files (Instagram, WhatsApp, Messages…), else a download.
import { trackShare } from '@/utils/analytics/siteActions';

/** Can this browser share an image file? */
export function canShareImages() {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function' || typeof File === 'undefined') return false;
  try {
    return navigator.canShare({ files: [new File([''], 'card.png', { type: 'image/png' })] });
  } catch {
    return false;
  }
}

/** Open the share sheet with the picture. -> false when the person closed it without sharing. */
export async function shareImage(blob, { fileName, title, text }) {
  const file = new File([blob], fileName, { type: blob.type || 'image/png' });
  try {
    await navigator.share({ files: [file], title, text });
    trackShare({ method: 'picture', contentType: 'card' });
    return true;
  } catch (err) {
    if (err?.name === 'AbortError') return false;
    throw err;
  }
}

/** Save the picture as a file. */
export function downloadImage(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
