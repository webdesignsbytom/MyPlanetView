const MINUTES_PER_DAY = 1440;

// The band the sky uses, clear of the map's overlays: below the title cards and banner
// along the top, and inside the toolbar column (right) and the screen edges
const LEFT = 8;
const RIGHT = 88;
const HIGHEST = 22; // % from the top, mid-sky
const LOWEST = 34; // % from the top, at the band's edges

// Where the sun and moon sit across the sky for a time of day (my_planet's rule): the
// sun runs from the right (east) at midnight to the left (west) at the next midnight,
// and the moon sits opposite. Each rides a gentle arc, highest when mid-sky.
// Positions are percentages of the map's width and height.
export function skyPositions(date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const sunT = 1 - minutes / MINUTES_PER_DAY; // 1 = east edge, 0 = west edge
  const moonT = 1 - sunT;
  const place = (t) => ({
    x: LEFT + t * (RIGHT - LEFT),
    y: LOWEST - Math.sin(t * Math.PI) * (LOWEST - HIGHEST),
  });
  return { sun: place(sunT), moon: place(moonT) };
}
