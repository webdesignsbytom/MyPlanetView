// A trial of looks for the nav buttons (18 Nov 2026, the user's wish: "black on red definitely
// looks bad"; each button a different look, to choose from side by side). The nav gives
// each button its place in the list (`index`), so the signed-in nav shows all ten:
// My map, Challenges, Home, Countries, About, FAQ, Pricing, Contact, Account, Logout.
// Once one is chosen, every button takes it and this file goes.

// What every look shares: the travel face, the size, and a press
const SHARED = 'relative grid items-center px-4 py-1 font-travel text-xl tracking-wide transition active:scale-95';

// A look that draws an outline inside the button replaces the site's focus ring, so it
// puts the ring back for the keyboard
const KEEP_FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-colour6';

// The luggage tag's punched hole and pointed end, and the ribbon's swallowtails
const TAG = `pl-8 pr-6 [clip-path:polygon(0_0,calc(100%-0.75rem)_0,100%_50%,calc(100%-0.75rem)_100%,0_100%)] before:absolute before:left-3 before:top-1/2 before:size-2.5 before:-translate-y-1/2 before:rounded-full before:bg-poster-paper`;
const RIBBON = 'px-8 [clip-path:polygon(0_0,100%_0,calc(100%-0.75rem)_50%,100%_100%,0_100%,0.75rem_50%)]';

export const NAV_TRIAL_STYLES = [
  {
    name: 'Cream on red',
    base: 'rounded-sm border-2 border-poster-brown bg-poster-red text-poster-cream shadow-paper hover:brightness-110',
    active: 'rounded-sm border-2 border-poster-brown bg-poster-red-deep text-poster-gold-light shadow-paper',
  },
  {
    name: 'Paper ticket',
    base: 'rounded-sm border-2 border-poster-brown bg-paper-cream text-poster-red-deep shadow-paper hover:bg-poster-paper',
    active: 'rounded-sm border-2 border-poster-red-deep bg-poster-red-deep text-paper-cream shadow-paper',
  },
  {
    name: 'Rubber stamp',
    base: '-rotate-1 rounded-md border-4 border-double border-poster-red uppercase text-poster-red hover:rotate-0 hover:bg-poster-red/10',
    active: 'rounded-md border-4 border-double border-poster-cream bg-poster-red uppercase text-poster-cream',
  },
  {
    name: 'Red and gold',
    base: 'rounded-sm border-2 border-poster-gold-dark bg-poster-red-deep text-poster-gold-light shadow-paper hover:brightness-125',
    active: 'rounded-sm border-2 border-poster-gold-dark bg-poster-gold-light text-poster-red-deep shadow-paper',
  },
  {
    name: 'Luggage tag',
    base: `${TAG} bg-poster-brown text-poster-cream hover:brightness-110`,
    active: `${TAG} bg-poster-red-deep text-poster-gold-light`,
  },
  {
    name: 'Enamel sign',
    base: `rounded-md bg-colour7 text-poster-cream shadow-paper outline-2 -outline-offset-4 outline-poster-cream hover:brightness-110 ${KEEP_FOCUS_RING}`,
    active: `rounded-md bg-poster-cream text-colour7 shadow-paper outline-2 -outline-offset-4 outline-colour7 ${KEEP_FOCUS_RING}`,
  },
  {
    name: 'Stitched leather',
    base: `rounded-md bg-poster-brown text-poster-cream shadow-paper outline-2 -outline-offset-4 outline-dashed outline-poster-cream/70 hover:brightness-110 ${KEEP_FOCUS_RING}`,
    active: `rounded-md bg-poster-ink text-poster-gold-light shadow-paper outline-2 -outline-offset-4 outline-dashed outline-poster-gold-light ${KEEP_FOCUS_RING}`,
  },
  {
    name: 'Ribbon',
    base: `${RIBBON} bg-poster-red-deep text-poster-cream hover:brightness-110`,
    active: `${RIBBON} bg-poster-gold-dark text-poster-cream`,
  },
  {
    name: 'Green oval stamp',
    base: 'rotate-1 rounded-full border-[3px] border-poster-green text-poster-green hover:rotate-0 hover:bg-poster-green/10',
    active: 'rounded-full border-[3px] border-poster-green bg-poster-green text-poster-cream',
  },
  {
    name: 'Plain ink',
    base: 'text-poster-ink decoration-poster-red decoration-2 underline-offset-4 hover:text-poster-red-deep hover:underline',
    active: 'text-poster-red-deep underline decoration-poster-red decoration-wavy decoration-2 underline-offset-4',
  },
];

/** The classes for the nav button at `index` (its place in the list), current page or not. */
export function navTrialClass(index, isActive = false) {
  const style = NAV_TRIAL_STYLES[index % NAV_TRIAL_STYLES.length];
  return `${SHARED} ${isActive ? style.active : style.base}`;
}
