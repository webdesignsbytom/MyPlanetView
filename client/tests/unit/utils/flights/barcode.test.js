// Reading a boarding pass's barcode from a picture (utils/flights/barcode.js): the browser's own
// detector where it reads these codes, else ZXing's (the e2e tests read a real one).
import { afterEach, describe, expect, it, vi } from 'vitest';

const decode = vi.fn();
vi.mock('@zxing/library', () => ({
  BarcodeFormat: { PDF_417: 'PDF_417', AZTEC: 'AZTEC', QR_CODE: 'QR_CODE', DATA_MATRIX: 'DATA_MATRIX' },
  DecodeHintType: { POSSIBLE_FORMATS: 'formats', TRY_HARDER: 'harder' },
  BinaryBitmap: class {},
  HybridBinarizer: class {},
  RGBLuminanceSource: class {},
  MultiFormatReader: class {
    decode(...args) {
      return decode(...args);
    }
  },
}));
const { readBarcode } = await import('@/utils/flights/barcode');

const bitmap = { width: 400, height: 200, close: vi.fn() };
afterEach(() => {
  vi.unstubAllGlobals();
  delete window.BarcodeDetector;
  decode.mockReset();
});

describe('readBarcode', () => {
  it('uses the browser’s own detector when it reads boarding passes', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    window.BarcodeDetector = class {
      static getSupportedFormats = () => Promise.resolve(['pdf417', 'qr_code']);
      detect = () => Promise.resolve([{ rawValue: 'M1PASS' }]);
    };
    expect(await readBarcode(new Blob(['x']))).toBe('M1PASS');
    expect(decode).not.toHaveBeenCalled();
    expect(bitmap.close).toHaveBeenCalled();
  });

  it('falls back to ZXing, and is null when nothing is found', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    const context = { fillRect: vi.fn(), drawImage: vi.fn(), getImageData: () => ({ data: new Uint8ClampedArray(400 * 200 * 4) }) };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
    decode.mockReturnValueOnce({ getText: () => 'M1ZXING' });
    expect(await readBarcode(new Blob(['x']))).toBe('M1ZXING');
    decode.mockImplementationOnce(() => {
      throw new Error('NotFoundException');
    });
    expect(await readBarcode(new Blob(['x']))).toBeNull();
  });
});
