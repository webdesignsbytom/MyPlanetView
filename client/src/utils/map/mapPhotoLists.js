// The two photo lists the map page keeps (usePhotoPage options). MapPage starts them with
// preloadPhotoPage() as soon as it knows the map's id, alongside the map itself.

// The newest photos, grouped by country for the hover postcards (screens that can hover only)
export const PREVIEW_PHOTOS = { limit: 60 };

// The photos with no country: the most a page holds; the count reads "60+" beyond it
export const UNPLACED_PHOTOS = { unplaced: true, limit: 60 };
