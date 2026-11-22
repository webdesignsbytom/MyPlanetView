// "Where have you been?" (components/map/QuickFillDialog.jsx; 22 Nov 2026, the user's wish):
// when the map offers it by itself.

// Only on a map with this many countries visited or lived in at most (a new map: its
// birthplaces), so a full map never asks
export const QUICK_FILL_MAX_VISITS = 3;
// Once a visit (the account's setting `countriesAsked` keeps it to once for good); the e2e
// fixtures set it so tests start as if it had shown
export const QUICK_FILL_SHOWN_KEY = 'mpv:quickFillShown';
