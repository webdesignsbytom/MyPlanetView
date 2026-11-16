// A moment's pin (docs/API.md "Moments", "A pin on the map"): its words and its link out.
// Our map draws countries, not streets, so a pin's exact spot is checked on Google Maps.

/** "48.85840° N, 2.29450° E" */
export const spotText = ({ latitude, longitude }) =>
  `${Math.abs(latitude).toFixed(5)}° ${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(5)}° ${longitude >= 0 ? 'E' : 'W'}`;

/** The spot on Google Maps (a plain link: nothing of Google's runs on our pages). */
export const googleMapsUrl = ({ latitude, longitude }) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude.toFixed(6)}%2C${longitude.toFixed(6)}`;

/** Who sees a pin, in words, for its owner and editors. */
export const spotAudience = (shared) => (shared ? 'Everyone the map is shared with sees this spot' : 'Only you and the map’s editors see this spot');
