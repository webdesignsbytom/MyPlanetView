import React from 'react';
import { Link } from 'react-router-dom';
import { FaPassport } from 'react-icons/fa';
// Utils
import { mapActionClass } from '@/utils/map/mapActionClass';

// "Open passport" in a map panel (24 Nov 2026, the user's wish: the country list and Where to
// go next), the size of the panel's buttons. `href` is the map's passport, its own address or
// through the share link.
function PassportLink({ href }) {
  return (
    <Link to={href} className={mapActionClass({ quiet: true })} data-passport-link>
      <FaPassport aria-hidden='true' className='self-center' />
      <span>Open passport</span>
    </Link>
  );
}

export default PassportLink;
