// The passport's landmark stamps (components/passport/LandmarkStamp.jsx): the four shapes'
// drawing, in their own viewBox units. Each has an outer and an inner border, the photo's
// frame, the curve the landmark's name is set on (`name`, with its length and the largest
// type that fits) and the one for the date, and where the UNESCO mark goes.

export const STAMP_GEOMETRY = {
  circle: {
    width: 200,
    height: 200,
    outer: { tag: 'circle', cx: 100, cy: 100, r: 95 },
    inner: { tag: 'circle', cx: 100, cy: 100, r: 85 },
    photo: { tag: 'circle', cx: 100, cy: 100, r: 44 },
    // Over the top from 170° to 10°, letters outwards; under the bottom from 140° to 40°
    name: { d: 'M35 111.5 A66 66 0 1 1 165 111.5', length: 230, max: 14 },
    date: { d: 'M41.8 148.9 A76 76 0 0 0 158.2 148.9', length: 133 },
    marks: [[100, 152]],
  },
  oval: {
    width: 240,
    height: 170,
    outer: { tag: 'ellipse', cx: 120, cy: 85, rx: 115, ry: 80 },
    inner: { tag: 'ellipse', cx: 120, cy: 85, rx: 105, ry: 70 },
    photo: { tag: 'ellipse', cx: 120, cy: 82, rx: 42, ry: 30 },
    name: { d: 'M33.3 94.4 A88 54 0 1 1 206.7 94.4', length: 255, max: 14 },
    date: { d: 'M39.7 120.6 A98 62 0 0 0 200.3 120.6', length: 157 },
    marks: [[120, 121]],
  },
  rectangle: {
    width: 220,
    height: 160,
    outer: { tag: 'rect', x: 3, y: 3, width: 214, height: 154, rx: 12 },
    inner: { tag: 'rect', x: 12, y: 12, width: 196, height: 136, rx: 6 },
    photo: { tag: 'rect', x: 70, y: 50, width: 80, height: 62, rx: 4 },
    name: { d: 'M26 44 Q110 22 194 44', length: 172, max: 15 },
    date: { d: 'M40 134 Q110 146 180 134', length: 143 },
    marks: [
      [44, 81],
      [176, 81],
    ],
  },
  // Pointing down, like a pennant: the name and date across its wide top
  triangle: {
    width: 220,
    height: 196,
    outer: { tag: 'polygon', points: '6,8 214,8 110,190' },
    inner: { tag: 'polygon', points: '18.5,15.3 201.5,15.3 110,175.4' },
    photo: { tag: 'circle', cx: 110, cy: 98, r: 30 },
    name: { d: 'M36 42 Q110 28 184 42', length: 150, max: 12 },
    date: { d: 'M50 60 L170 60', length: 120 },
    marks: [[110, 146]],
  },
};

const AVERAGE_CAP_WIDTH = 0.74; // Poppins semibold capitals, with the stamps' letter spacing, per em
const SMALLEST = 7.5;

/**
 * The name as it fits its curve: the type size, and the text (cut with an ellipsis when
 * even the smallest size can't hold it all).
 */
export function fitName(name, { length, max }) {
  const text = String(name).toUpperCase();
  const size = Math.min(max, length / (text.length * AVERAGE_CAP_WIDTH));
  if (size >= SMALLEST) return { text, size };
  const room = Math.floor(length / (SMALLEST * AVERAGE_CAP_WIDTH));
  return { text: `${text.slice(0, room - 1).trimEnd()}…`, size: SMALLEST };
}
