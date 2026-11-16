// The photo lists the map page keeps (usePhotoPage options). MapPage starts the unplaced
// one with preloadPhotoPage() as soon as it knows the map's id, alongside the map itself.
// (The hover postcards show the country's poster, never photos: no list for them.)

// The photos with no country: the most a page holds; the count reads "60+" beyond it
export const UNPLACED_PHOTOS = { unplaced: true, limit: 60 };

// The photo album's list (MapPhotosPanel): the whole map, newest first, a page at a time,
// each with its screen-sized copy (`display`) for the album's full-screen viewer
export const MAP_PHOTOS = { limit: 60, display: true };
