// my_planet's two map types. "Detailed" shows country names, the grid and the
// landmark pins at every zoom; "Regular" leaves them to the toggles and the zoom.
// `preview` is the picker's image set in src/assets/images/map-styles/ (null: drawn).
export const MAP_TYPES = [
  { id: 'regular', label: 'Regular', preview: null },
  { id: 'detailed', label: 'Detailed', preview: 'detailed' },
];

export const MAP_TYPE_IDS = MAP_TYPES.map((type) => type.id);
