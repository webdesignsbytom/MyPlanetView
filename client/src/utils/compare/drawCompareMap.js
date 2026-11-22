// The picture of two maps compared (ComparePage): the world with the countries on both, only
// on the first and only on the second in COMPARE_COLOURS, drawn on a canvas as the share card
// is (it reuses its map drawing).
import { COMPARE_COLOURS } from '@/utils/constants/brandColours';
import { MAP_BOTTOM_NO_ANTARCTICA, MAP_BOTTOM_WITH_ANTARCTICA, MAP_TOP, MAP_WIDTH, drawMap } from '@/utils/shareCard/drawShareCard';

/** A PNG blob of `width` pixels across, from compareMaps' groups. */
export async function drawCompareMap({ both, onlyA, onlyB, width = 1600 }) {
  const colours = {};
  for (const code of both) colours[code] = COMPARE_COLOURS.both;
  for (const code of onlyA) colours[code] = COMPARE_COLOURS.onlyA;
  for (const code of onlyB) colours[code] = COMPARE_COLOURS.onlyB;
  const codes = Object.keys(colours);
  const withAntarctica = codes.includes('AQ') || codes.includes('XS');
  const extent = (withAntarctica ? MAP_BOTTOM_WITH_ANTARCTICA : MAP_BOTTOM_NO_ANTARCTICA) - MAP_TOP;
  const height = Math.round((width * extent) / MAP_WIDTH);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawMap(canvas.getContext('2d'), {
    box: { x: 0, y: 0, width, height },
    highlight: new Set(codes),
    splitUk: false,
    colours,
    withAntarctica,
    edgeWidth: Math.max(0.8, width / 1600),
    dotRadius: width / 300,
    frameWidth: 2,
  });
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The picture couldn’t be drawn.'))), 'image/png'));
}
