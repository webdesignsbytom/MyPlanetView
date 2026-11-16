// How each kind of travel offer is named to visitors (docs/API.md, "Travel offers"): the
// Travel Desk's shelves, in the order a trip is booked, and the word on a card's stamp
// when it has no picture. (The admin page has its own, shorter labels.)

export const OFFER_KIND_ORDER = Object.freeze(['HOTEL', 'TOUR', 'FLIGHT', 'CAR_HIRE', 'ESIM', 'INSURANCE', 'LUGGAGE', 'OTHER', 'PRINTS']);

export const OFFER_SHELF_TITLES = Object.freeze({
  HOTEL: 'Places to stay',
  TOUR: 'Tours and tickets',
  FLIGHT: 'Flights',
  CAR_HIRE: 'Car hire',
  ESIM: 'Phone data (eSIMs)',
  INSURANCE: 'Travel insurance',
  LUGGAGE: 'Luggage',
  OTHER: 'More for the trip',
  PRINTS: 'Photo prints',
});

export const OFFER_KIND_WORDS = Object.freeze({
  HOTEL: 'Stay',
  TOUR: 'Tour',
  FLIGHT: 'Flight',
  CAR_HIRE: 'Car hire',
  ESIM: 'eSIM',
  INSURANCE: 'Cover',
  LUGGAGE: 'Luggage',
  OTHER: 'Travel',
  PRINTS: 'Prints',
});

export const offerKindWord = (kind) => OFFER_KIND_WORDS[kind] || OFFER_KIND_WORDS.OTHER;

// What a card's link is called: "Ad" first, so a screen reader says so before the title,
// then where it goes. The card's visible words are in it in the same order ("Ad", the
// title, "Visit <partner>"), so a speech user can say what they see.
export const offerLinkLabel = (offer) => `Ad: ${offer.title}. Visit ${offer.partner} (opens in a new tab)`;

// The Travel Desk's label (docs/FEATURE-PLAN.md, "Travel Desk")
export const PARTNER_OFFERS_NOTE = 'Partner offers. We may earn a commission if you book, at no cost to you.';

// The print partners' label, under "Print or download" (docs/FEATURE-PLAN.md, "Printing")
export const PRINT_OFFERS_NOTE = 'Partner offers. We may earn a commission if you order, at no cost to you.';
