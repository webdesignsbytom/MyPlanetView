import React, { createElement, useId } from 'react';
// Components
import UnescoMark from './UnescoMark';
// Utils
import { STAMP_GEOMETRY, fitName } from '@/utils/passport/stampShapes';
import { stampDate, stampLook } from '@/utils/passport/passportBook';

// One of the shape's parts as an SVG element ({ tag, ...attributes })
const part = ({ tag, ...attrs }, extra = {}) => createElement(tag, { ...attrs, ...extra });

/**
 * One landmark's stamp in the passport, drawn in SVG: one of four shapes, tilted and inked
 * as the landmark's id decides (so it always looks the same), with the landmark's name set
 * on a curve, its photo in the middle and the date it was stamped. UNESCO World Heritage
 * Sites carry a small temple. Decorative: the page says the same in words.
 */
function LandmarkStamp({ stamp }) {
  const id = useId();
  const { shape, tilt, ink } = stampLook(stamp.landmarkId);
  const g = STAMP_GEOMETRY[shape];
  const name = fitName(stamp.name, g.name);
  const date = stampDate(stamp.stampedOn);

  return (
    <svg
      viewBox={`0 0 ${g.width} ${g.height}`}
      aria-hidden='true'
      focusable='false'
      className={`block h-auto w-full overflow-visible ${ink}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <defs>
        <clipPath id={`${id}-photo`}>
          {part(g.photo)}
        </clipPath>
        <path id={`${id}-name`} d={g.name.d} />
        <path id={`${id}-date`} d={g.date.d} />
      </defs>
      <g fill='none' stroke='currentColor' strokeLinejoin='round' className='opacity-90'>
        {part(g.outer, { strokeWidth: 5 })}
        {part(g.inner, { strokeWidth: 1.5 })}
      </g>
      {stamp.photo?.thumbUrl ? (
        <image
          href={stamp.photo.thumbUrl}
          width={g.width}
          height={g.height}
          preserveAspectRatio='xMidYMid slice'
          clipPath={`url(#${id}-photo)`}
          {...photoBox(g.photo)}
        />
      ) : null}
      {part(g.photo, { fill: 'none', stroke: 'currentColor', strokeWidth: 2 })}
      <g fill='currentColor' className='font-main font-semibold opacity-90' letterSpacing='0.06em'>
        <text fontSize={name.size}>
          <textPath href={`#${id}-name`} startOffset='50%' textAnchor='middle'>
            {name.text}
          </textPath>
        </text>
        {date ? (
          <text fontSize={11}>
            <textPath href={`#${id}-date`} startOffset='50%' textAnchor='middle'>
              {date}
            </textPath>
          </text>
        ) : null}
      </g>
      {stamp.isUnesco ? g.marks.map(([x, y]) => <UnescoMark key={`${x}-${y}`} x={x} y={y} />) : null}
    </svg>
  );
}

// The photo's picture fills the box round its frame (the clip cuts it to the frame's shape)
function photoBox(frame) {
  if (frame.tag === 'rect') return { x: frame.x, y: frame.y, width: frame.width, height: frame.height };
  const rx = frame.rx ?? frame.r;
  const ry = frame.ry ?? frame.r;
  return { x: frame.cx - rx, y: frame.cy - ry, width: rx * 2, height: ry * 2 };
}

export default LandmarkStamp;
