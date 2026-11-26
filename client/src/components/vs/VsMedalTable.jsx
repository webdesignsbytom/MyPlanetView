import React from 'react';
// Components
import VsMedal from './VsMedal';
// Utils
import { placeWords } from '@/utils/vs/vsWords';

/**
 * The medal table (26 Nov 2026, the user's wish: "gold silver bronze ratings for top people"):
 * everyone by their place, most golds first, then silvers, then bronzes, with how many of each;
 * someone with no map counting last, with no place. "You" marks the viewer.
 */
function VsMedalTable({ members }) {
  const rows = [...members].sort((a, b) => (a.place ?? 99) - (b.place ?? 99) || a.name.localeCompare(b.name));
  return (
    <table className='w-full border-collapse text-sm' data-vs-medal-table=''>
      <caption className='sr-only'>The medal table</caption>
      <thead>
        <tr className='border-b-2 border-poster-brown text-left'>
          <th scope='col' className='py-2 pr-2 font-travel uppercase tracking-wide text-colour9'>
            Place
          </th>
          <th scope='col' className='py-2 pr-2 font-travel uppercase tracking-wide text-colour9'>
            Who
          </th>
          {['gold', 'silver', 'bronze'].map((medal) => (
            <th key={medal} scope='col' className='w-12 py-2 text-center'>
              <VsMedal medal={medal} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((member, i) => (
          <tr key={member.key ?? `${member.name}-${i}`} className={`border-b border-dashed border-poster-brown/40 ${member.isYou ? 'bg-poster-paper/40 font-semibold' : ''}`} data-vs-member={member.name}>
            <td className='py-2 pr-2 font-travel text-lg'>{member.place ? placeWords(member.place) : '–'}</td>
            <td className='py-2 pr-2'>
              {member.name}
              {member.isYou ? ' (you)' : ''}
              {member.counting ? null : <span className='block text-xs font-normal opacity-80'>No map counting</span>}
            </td>
            <td className='py-2 text-center tabular-nums'>{member.gold}</td>
            <td className='py-2 text-center tabular-nums'>{member.silver}</td>
            <td className='py-2 text-center tabular-nums'>{member.bronze}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default VsMedalTable;
