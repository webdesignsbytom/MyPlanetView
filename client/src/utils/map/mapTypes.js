// my_planet's two map types. "Detailed" shows country names and the grid at every zoom;
// "Regular" leaves them to the toggles and the zoom. The landmark pins have their own
// setting on both (mapSettings.js LANDMARK_PIN_MODES, 17 Nov 2026).
// `preview` is the picker's image set in src/assets/images/map-styles/: `regular` is a
// screenshot of our own map (mock mode, Regular type, the default style, the whole world),
// `detailed` my_planet's detailed map; both 949 px wide, cropped alike by the picker.
export const MAP_TYPES = [
  { id: 'regular', label: 'Regular', preview: 'regular' },
  { id: 'detailed', label: 'Detailed', preview: 'detailed' },
];

export const MAP_TYPE_IDS = MAP_TYPES.map((type) => type.id);
