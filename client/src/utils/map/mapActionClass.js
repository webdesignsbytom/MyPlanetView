// A map panel's button look (a compact btn-poster), the same in every map style: `quiet` for
// secondary actions (parchment), `danger` for removing things (btn-danger). MapActionButton
// uses it, and so does a link that should look like one (Settings' "Bring trips from
// Polarsteps"), so it's the same size as the buttons beside it.
export function mapActionClass({ quiet = false, danger = false } = {}) {
  return `grid-flow-col justify-center gap-2 text-center [grid-auto-columns:minmax(0,max-content)] [--btn-leading:1.5rem] [--btn-pad-x:1rem] [--btn-pad-y:0.25rem] [--btn-size:1.0625rem] ${
    danger ? 'btn-danger' : quiet ? 'btn-paper' : 'btn-poster'
  }`;
}
