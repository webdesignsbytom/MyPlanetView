// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isPictureFile, uploadScreenshot, SCREENSHOT_EDGE } from '@/utils/feedback/uploadScreenshot';
import { presignFeedbackScreenshot } from '@/api/feedbackApi';
import { decode, encode } from '@/utils/photos/makePhotoCopies';
import { putFile } from '@/utils/photos/putFile';

vi.mock('@/api/feedbackApi', () => ({ presignFeedbackScreenshot: vi.fn() }));
vi.mock('@/utils/photos/makePhotoCopies', () => ({ decode: vi.fn(), encode: vi.fn() }));
vi.mock('@/utils/photos/putFile', () => ({ putFile: vi.fn() }));

const file = (name, type = 'image/png') => ({ name, type });
const close = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  decode.mockResolvedValue({ close });
  encode.mockResolvedValue({ blob: { size: 1234 }, contentType: 'image/webp' });
  presignFeedbackScreenshot.mockResolvedValue({ key: 'myplanetview/feedback/u1/shot-x.webp', upload: { url: 'https://bucket/put' } });
  putFile.mockImplementation((url, blob, type, onProgress) => {
    onProgress(617);
    return Promise.resolve();
  });
});

describe('uploadScreenshot', () => {
  it('draws the picture again, presigns its size and type, sends it and answers its key', async () => {
    const progress = vi.fn();
    await expect(uploadScreenshot(file('shot.png'), progress)).resolves.toBe('myplanetview/feedback/u1/shot-x.webp');
    expect(encode).toHaveBeenCalledWith(expect.anything(), SCREENSHOT_EDGE, expect.any(Number));
    expect(close).toHaveBeenCalled();
    expect(presignFeedbackScreenshot).toHaveBeenCalledWith({ contentType: 'image/webp', bytes: 1234 });
    expect(putFile).toHaveBeenCalledWith('https://bucket/put', { size: 1234 }, 'image/webp', expect.any(Function), 1234);
    expect(progress).toHaveBeenCalledWith(0.5);
  });

  it('turns away a HEIC, something that isn’t a picture, or one too big once drawn', async () => {
    await expect(uploadScreenshot(file('IMG_1.HEIC', 'image/heic'))).rejects.toThrow(/HEIC/);
    await expect(uploadScreenshot(file('notes.txt', 'text/plain'))).rejects.toThrow(/choose a picture/);
    encode.mockResolvedValue({ blob: { size: 9 * 1024 * 1024 }, contentType: 'image/jpeg' });
    await expect(uploadScreenshot(file('big.jpg', 'image/jpeg'))).rejects.toThrow(/too big/);
    expect(presignFeedbackScreenshot).not.toHaveBeenCalled();
  });

  it('knows a picture by its type or its name', () => {
    expect(isPictureFile(file('a.webp', ''))).toBe(true);
    expect(isPictureFile(file('a', 'image/gif'))).toBe(true);
    expect(isPictureFile(file('a.pdf', 'application/pdf'))).toBe(false);
    expect(isPictureFile(null)).toBe(false);
  });
});
