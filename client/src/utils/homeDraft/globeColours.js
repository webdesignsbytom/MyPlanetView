// The home page draft's globe colours (dev only, /dev/home). It's drawn on a canvas, which
// can't read the tokens, so check-house-rules allows this file its literal colours.
export const GLOBE_COLOURS = {
  // Light from the top left, night towards the bottom right
  shade: ['#6496c52b', '#00102706', '#020b2680'],
  // The atmosphere round the edge
  rim: ['#78c8ff00', '#74bdff19', '#80ceffa8', '#d0efffbd'],
  glow: '#64adeb',
  edge: '#a5daefb3',
  // A card's country
  countryFill: '#3af1b79c',
  countryEdge: '#9effdf',
  // The line from a card to its place, and the place's pin
  leader: '#ffd980',
  pinRing: '#ffe0a5ac',
  pinDot: '#fff0c5',
};
