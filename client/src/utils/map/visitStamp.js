// The country list's statuses as rubber stamps, inked the way the map marks them:
// visited in poster red (the star badge), lived there in saddle brown, want to go in
// ocean blue and dashed (the map's dashed outline), not yet a faint dashed brown. The
// inked ones are struck at a slight slant. Every stamp is 44 px tall, the height of the
// dropdown that replaces it while it's being changed (CountryStatusControl).
const STAMP = 'grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-2 px-3 text-left font-travel text-sm uppercase leading-tight tracking-wide';

const INK = {
  VISITED: '-rotate-1 border-colour6 bg-colour6/10 text-colour6',
  LIVED: '-rotate-1 border-colour9 bg-colour9/10 text-colour9',
  WANT_TO_GO: '-rotate-1 border-dashed border-colour7 text-colour7',
};

const NOT_YET = 'border-dashed border-colour9/40 text-colour9';

export const visitStampClass = (status) => `${STAMP} ${INK[status] || NOT_YET}`;
