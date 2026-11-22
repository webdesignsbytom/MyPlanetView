// The Pricing page's words (docs/FEATURE-PLAN.md, "The pitch" and "Tiers"). It sells the
// map, its looks and private sharing; the photo limits are a line on each ticket. Every
// number comes from the plan constants, so a price or a limit changes in one place.
//
// `soon: true` marks a feature that isn't built yet (the launch list in FEATURE-PLAN.md,
// "Phases"): the page shows it with a clock and "Coming soon" (PricingFeature), never as
// there. Take the flag off once it's live.
import { CompanyName } from '../constants/constants.js';
import { EDITORS_PER_MAP, FREE_MAPS, INCLUDED_MAPS, PLANS, formatPence } from '../constants/plans.js';
import { REFUND_DAYS } from '../plans/billing.js';

const count = (n) => n.toLocaleString('en-GB');
const perCountry = (planId) => `${count(PLANS[planId].limits.photosPerCountry)} photos of each country, on each map`;
const GB = 1000 ** 3;

export const pricingIntro = `Every map starts in Economy, free. Business and First Class keep your full-size originals and far more photos of each country. Your private map, its looks and its sharing come with every plan.`;

// The three tickets, side by side
export const planTickets = [
  {
    id: 'FREE',
    tagline: 'Start your map',
    features: [
      { text: 'Your private travel map, with every country you’ve been coloured in' },
      // A map's own design (docs/API.md "Map designs"; 21 Nov 2026): free on every plan
      { text: 'Your own map design: a picture of yours on the sea, and your colours for every country' },
      { text: perCountry('FREE') },
      { text: 'A print-quality copy of every photo, good up to A4' },
      { text: 'Travel offer cards in your photo galleries keep it free' },
    ],
  },
  {
    id: 'REGULAR',
    tagline: 'For the photos you keep',
    features: [
      { text: 'Everything in Economy' },
      { text: perCountry('REGULAR') },
      { text: 'Your full-size originals, untouched: for posters, canvases, cropping and re-editing' },
      { text: 'No ad cards for you, on any map; fewer for the people you share with' },
      { text: 'A navy Business Class passport cover' },
    ],
  },
  {
    id: 'PREMIUM',
    tagline: 'The whole journey',
    features: [
      { text: 'Everything in Business' },
      { text: perCountry('PREMIUM') },
      { text: 'Videos of your trips, beside the photos' },
      // Each plan has its own passport cover (16 Nov). "Extra map styles" (never built) gave
      // way to every map's own design, free (21 Nov 2026, the user's wish)
      { text: 'A black and gold First Class passport cover' },
      { text: 'No ad cards on your maps, for anyone who looks' },
    ],
  },
];

// Worded as FEATURE-PLAN.md allows ("Ads by tier", "Travel Desk"): not "no ads anywhere",
// which the Travel Desk would break, and "on a map", as the public country guides show
// their two partner cards to every visitor
export const adsLine = {
  // Not "paying members": an Economy account paying for an extra map still sees them
  lead: 'Business and First Class members never see ad cards on a map.',
  text: 'Not on their own maps or anyone else’s. On a First Class map nobody does: no adverts in your albums or on your shared maps, and travel offers only when you ask for them, at the Travel Desk.',
};

// What every plan has
export const everyPlanFeatures = [
  { text: 'Private by default: your map is seen only by the people you add, or give the link to.' },
  { text: 'No followers, no public profiles and no feed. Nobody comes across your map unless you send it to them.' },
  { text: 'The map is the album: every photo sits in the country it was taken in.' },
  { text: `As many viewers and share links as you like, and up to ${EDITORS_PER_MAP} editors on each map, each with their own login.` },
  { text: 'One trip shared on its own, so friends from one holiday see only that holiday.' },
  { text: 'Trips with their stops, dates and route drawn on the map.' },
  { text: 'Landmarks suggested from where each photo was taken.' },
  { text: 'Four looks for the map, or a design of your own: your picture on the sea and your colours on the countries.' },
  { text: 'Every map other people share with you, free: they never count as yours.' },
  { text: 'A passport with a stamp for every landmark you photograph.' },
  { text: 'Slideshows of your whole map, one country or one trip.' },
  { text: 'The Travel Desk: places to stay, tours and flights for a trip or a country, from our travel partners, only when you ask.' },
  { text: 'Badges as your map fills up, and goals of your own: a number of countries, a bucket list, a whole region.' },
  // Friends challenges, monthly photo themes and the first 20 country guides (checked 16 Nov)
  { text: 'Challenges with friends, monthly photo themes and country guides.' },
  // The map poster (22 Nov 2026)
  { text: 'A print-ready poster of your map, up to 70 × 50 cm, for any print shop.' },
  // The importer (docs/API.md "Importing from Polarsteps")
  { text: 'Coming from Polarsteps? Bring your trips, photos and stories with you.' },
];

// More than one map (FEATURE-PLAN.md, "Maps")
const extra = (planId, interval) => formatPence(PLANS[planId].extraMap[interval]);
export const extraMaps = {
  intro: `Every account has ${FREE_MAPS} maps free: your main map on your plan, and ${FREE_MAPS - INCLUDED_MAPS} more on Economy. Want another of them on your plan, or more maps? Each extra map you pay for is one more map with your plan’s full limits, and nothing is split between them.`,
  prices: [
    { plans: `${PLANS.FREE.name} and ${PLANS.REGULAR.name}`, month: extra('REGULAR', 'MONTH'), year: extra('REGULAR', 'YEAR') },
    { plans: PLANS.PREMIUM.name, month: extra('PREMIUM', 'MONTH'), year: extra('PREMIUM', 'YEAR'), note: 'More, as it keeps videos' },
  ],
  example: `Sam keeps a solo map and “The Smiths” for the family, both free. When France fills up on the family map, Sam moves to ${PLANS.REGULAR.name} with it as the main map (${count(PLANS.REGULAR.limits.photosPerCountry)} photos of each country), and later upgrades the solo map too, for ${extra('REGULAR', 'MONTH')} a month.`,
};

// Gifts (docs/API.md "Gifts"; 21 Nov 2026): a year of a paid plan, paid once
export const gifts = {
  intro: `Give someone a year of ${PLANS.REGULAR.name} (${formatPence(PLANS.REGULAR.price.YEAR)}) or ${PLANS.PREMIUM.name} (${formatPence(PLANS.PREMIUM.price.YEAR)}), paid once, for Christmas, a wedding or a birthday. Its code comes to you to give, with a page to print or send on, and their year starts the day they redeem it.`,
  cta: 'Give a year of travel',
};

// The small print, kept honest
export const pricingNotes = [
  { text: `Paying yearly gets you about two months free: ${formatPence(PLANS.REGULAR.price.YEAR)} a year for ${PLANS.REGULAR.name}, ${formatPence(PLANS.PREMIUM.price.YEAR)} for ${PLANS.PREMIUM.name}.` },
  { text: 'Upgrade the day you need it. Changing plan never deletes anything: originals already kept stay, and a country over the new limit keeps its photos but takes no more.' },
  { text: `A fair-use limit of ${Math.round(PLANS.REGULAR.limits.storageCapBytes / GB)} GB of photos on each Business map, and ${Math.round(PLANS.PREMIUM.limits.storageCapBytes / GB)} GB on First Class, keeps things fair. Most people never get near it.` },
  { text: 'Invited to a Business or First Class map? Join within 7 days and that plan is half price for your first 3 months (or the same saving off a year). One welcome offer per account: not with a promo code.' },
  // Give a month, get a month (docs/API.md; 21 Nov 2026)
  { text: 'Give a month, get a month: send a friend your invite link from your account page. Their first month is free, and when they go on to pay, you get a month free too, up to 12 a year.' },
  { text: `Payments go through Stripe. Cancel any time from your account page, and the plan runs to the end of the period you’ve paid for. Changed your mind? Tell us within ${REFUND_DAYS} days of your first payment for a full refund.` },
  // "Download my data" is on the account page (docs/API.md, "Your data")
  { text: `Prices are in pounds sterling. Getting a copy of all your data is free on every plan, as the law says it should be: it’s a button on your account page.` },
];

export const pricingCta = {
  title: 'Start in Economy, upgrade when France fills up',
  text: `Creating your map is free. Sign up, colour in your first country and add your photos; ${CompanyName} shows how full each country is as you go.`,
};
