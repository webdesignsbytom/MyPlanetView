import React from 'react';
// Constants
import { CompanyName } from '@/utils/constants/constants';
// Utils
import { countryName } from '@/utils/map/countries';
import { stampDate, stampLook } from '@/utils/passport/passportBook';

const WIDTH = 280;
const NAME_ROOM = 236;

// A country lived in is a residence stamp; one visited, or only stamped, an entry stamp
const HEADING = { LIVED: 'RESIDENT', VISITED: 'ADMITTED' };

/**
 * A visa page's entry stamp: a ruled rectangle with the country's name and the date it was
 * entered (its earliest photo, else the first visit's date), tilted and inked as the
 * country's code decides. Decorative: the page says the same in words.
 */
function EntryStamp({ countryCode, status, enteredOn }) {
  const { tilt, ink } = stampLook(`entry-${countryCode}`);
  const name = countryName(countryCode).toUpperCase();
  const size = Math.min(28, NAME_ROOM / (name.length * 0.74));
  const date = stampDate(enteredOn);
  return (
    <svg
      viewBox={`0 0 ${WIDTH} 150`}
      aria-hidden='true'
      focusable='false'
      className={`block h-auto w-full max-w-xs overflow-visible ${ink}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <g fill='none' stroke='currentColor' className='opacity-90'>
        <rect x='4' y='4' width='272' height='142' rx='8' strokeWidth='4' />
        <rect x='12' y='12' width='256' height='126' rx='4' strokeWidth='1.2' />
        <path d='M24 40 H256 M24 96 H256' strokeWidth='1.2' />
      </g>
      <g fill='currentColor' textAnchor='middle' className='font-main font-semibold opacity-90' letterSpacing='0.08em'>
        <text x={WIDTH / 2} y='32' fontSize='10'>
          {CompanyName.toUpperCase()} · {HEADING[status] || 'ENTRY'}
        </text>
        <text x={WIDTH / 2} y={68 + size / 3} fontSize={size} className='font-bold'>
          {name}
        </text>
        <text x={WIDTH / 2} y='124' fontSize='15'>
          {date || 'DATE NOT KNOWN'}
        </text>
      </g>
    </svg>
  );
}

export default EntryStamp;
