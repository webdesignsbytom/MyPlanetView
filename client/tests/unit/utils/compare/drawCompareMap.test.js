import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/shareCard/drawShareCard', async (importOriginal) => ({
  ...(await importOriginal()),
  drawMap: vi.fn(),
}));

import { drawMap, MAP_BOTTOM_NO_ANTARCTICA, MAP_BOTTOM_WITH_ANTARCTICA, MAP_TOP, MAP_WIDTH } from '@/utils/shareCard/drawShareCard';
import { drawCompareMap } from '@/utils/compare/drawCompareMap';
import { COMPARE_COLOURS } from '@/utils/constants/brandColours';

const context = { fake: 'context' };
let canvases;

describe('drawCompareMap', () => {
  beforeEach(() => {
    vi.mocked(drawMap).mockClear();
    canvases = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function getContext() {
      canvases.push(this);
      return context;
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((done, type) => done(new Blob(['png'], { type })));
  });

  it('draws each group in its colour and gives a PNG', async () => {
    const blob = await drawCompareMap({ both: ['FR'], onlyA: ['JP', 'PE'], onlyB: ['BR'] });

    expect(blob.type).toBe('image/png');
    expect(drawMap).toHaveBeenCalledTimes(1);
    const [ctx, options] = drawMap.mock.calls[0];
    expect(ctx).toBe(context);
    expect(options.colours).toEqual({ FR: COMPARE_COLOURS.both, JP: COMPARE_COLOURS.onlyA, PE: COMPARE_COLOURS.onlyA, BR: COMPARE_COLOURS.onlyB });
    expect([...options.highlight].sort()).toEqual(['BR', 'FR', 'JP', 'PE']);
    expect(options.splitUk).toBe(false);
    expect(options.withAntarctica).toBe(false);
  });

  it('sizes the picture to the map without Antarctica, at the width asked for', async () => {
    await drawCompareMap({ both: [], onlyA: ['JP'], onlyB: [], width: 1600 });
    const height = Math.round((1600 * (MAP_BOTTOM_NO_ANTARCTICA - MAP_TOP)) / MAP_WIDTH);
    expect([canvases[0].width, canvases[0].height]).toEqual([1600, height]);
    expect(drawMap.mock.calls[0][1]).toMatchObject({ box: { x: 0, y: 0, width: 1600, height }, edgeWidth: 1, dotRadius: 1600 / 300, frameWidth: 2 });
  });

  it('takes Antarctica in when either map has it or the South Pole', async () => {
    await drawCompareMap({ both: [], onlyA: [], onlyB: ['XS'], width: 800 });
    expect(drawMap.mock.calls[0][1].withAntarctica).toBe(true);
    expect(canvases[0].height).toBe(Math.round((800 * (MAP_BOTTOM_WITH_ANTARCTICA - MAP_TOP)) / MAP_WIDTH));
    // A small picture keeps its borders visible
    expect(drawMap.mock.calls[0][1].edgeWidth).toBe(0.8);

    await drawCompareMap({ both: ['AQ'], onlyA: [], onlyB: [] });
    expect(drawMap.mock.calls[1][1].withAntarctica).toBe(true);
  });

  it('fails when the browser can’t make the picture', async () => {
    HTMLCanvasElement.prototype.toBlob.mockImplementation((done) => done(null));
    await expect(drawCompareMap({ both: [], onlyA: [], onlyB: [] })).rejects.toThrow('The picture couldn’t be drawn.');
  });
});
