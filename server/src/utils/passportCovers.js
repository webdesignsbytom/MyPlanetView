// The passport's cover colours (26 Nov 2026, the user's wish: "add choosing passport colour, just
// the cover colour, and gold or silver lettering stays tied to the plan"; docs/API.md
// "Passport"). The leather only: real passports' colours. The client's copy is
// client/src/utils/passport/passportBook.js COVER_COLOURS (a test compares them).
export const PASSPORT_COLOURS = Object.freeze(['BURGUNDY', 'NAVY', 'BLACK', 'GREEN', 'BLUE', 'TAN']);

/** One of the cover colours, or null (the plan's own). */
export const isPassportColour = (value) => value === null || PASSPORT_COLOURS.includes(value);
