// A boarding pass's barcode read from a picture (a photo of the paper pass, a screenshot of a
// phone's pass or of the PDF): the browser's own BarcodeDetector where it reads these codes
// (Chrome on Android and Macs, Safari), else ZXing's JavaScript reader, loaded only then. Both
// read PDF417 (paper and PDFs), Aztec and QR (phone wallets). -> the text, or null
import { BRAND_GROUND } from '@/utils/constants/brandColours';

const FORMATS = ['pdf417', 'aztec', 'qr_code', 'data_matrix'];
// Big photos are drawn smaller first: the barcode stays readable and the reader stays quick
const MAX_SIDE = 2000;

async function withDetector(bitmap) {
  if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null;
  try {
    const supported = (await window.BarcodeDetector.getSupportedFormats?.()) ?? [];
    const formats = FORMATS.filter((format) => supported.includes(format));
    if (!formats.length) return null;
    const [found] = await new window.BarcodeDetector({ formats }).detect(bitmap);
    return found?.rawValue || null;
  } catch {
    return null;
  }
}

async function withZxing(bitmap) {
  const { BarcodeFormat, BinaryBitmap, DecodeHintType, HybridBinarizer, MultiFormatReader, RGBLuminanceSource } = await import('@zxing/library');
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  // A transparent screenshot read as if on paper
  context.fillStyle = BRAND_GROUND;
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  const grey = new Uint8ClampedArray(width * height);
  for (let i = 0; i < grey.length; i++) grey[i] = (data[i * 4] * 299 + data[i * 4 + 1] * 587 + data[i * 4 + 2] * 114) / 1000;
  const hints = new Map([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417, BarcodeFormat.AZTEC, BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX]],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  try {
    return new MultiFormatReader().decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(grey, width, height))), hints).getText();
  } catch {
    return null;
  }
}

/** The text of the barcode in a picture file, or null when none can be read. */
export async function readBarcode(file) {
  const bitmap = await createImageBitmap(file);
  try {
    return (await withDetector(bitmap)) ?? (await withZxing(bitmap));
  } finally {
    bitmap.close?.();
  }
}
