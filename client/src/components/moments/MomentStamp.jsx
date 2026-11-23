import React from 'react';
// Icons
import {
  FaBaby,
  FaBinoculars,
  FaBriefcase,
  FaGem,
  FaGlassCheers,
  FaGraduationCap,
  FaHeart,
  FaHiking,
  FaHome,
  FaMapSigns,
  FaPaw,
  FaPlaneDeparture,
  FaRing,
  FaStar,
  FaSwimmer,
  FaTheaterMasks,
  FaUmbrellaBeach,
  FaUtensils,
} from 'react-icons/fa';

// Each kind of moment's mark (utils/moments/momentKinds.js): a small round rubber stamp in
// the poster red, double-ringed and tilted like the toolbar's, with the kind's picture.
const KIND_ICONS = {
  BORN: FaBaby,
  MOVED_HERE: FaHome,
  WEDDING: FaRing,
  ENGAGEMENT: FaGem,
  GRADUATED: FaGraduationCap,
  NEW_JOB: FaBriefcase,
  MET_SOMEONE: FaHeart,
  CELEBRATION: FaGlassCheers,
  SAW_OR_DID: FaBinoculars,
  FIRST_TRIP: FaPlaneDeparture,
  ANNIVERSARY: FaStar,
  // A day on a trip (23 Nov 2026)
  SAFARI: FaPaw,
  HIKE: FaHiking,
  DIVE: FaSwimmer,
  TOUR: FaMapSigns,
  MEAL: FaUtensils,
  SHOW: FaTheaterMasks,
  BEACH: FaUmbrellaBeach,
};

// Decorative: the kind is always written beside it
function MomentStamp({ kind, className = 'h-10 w-10 text-lg' }) {
  const Icon = KIND_ICONS[kind] || FaBinoculars;
  return (
    <span
      aria-hidden='true'
      className={`grid -rotate-6 place-items-center rounded-full border-4 border-double border-poster-red bg-poster-paper text-poster-red shadow-paper ${className}`}
    >
      <Icon />
    </span>
  );
}

export default MomentStamp;
