// A map's or a trip's sharing settings (GET …/sharing, owner only) in the panel cache
// (utils/data/panelCache.js), so the share dialog opens at once (17 Nov 2026): the map
// page fetches them once the map has drawn; the dialog shows them, refreshes them quietly
// and keeps them current after each change. Its own module, so the map page can prefetch
// without loading the dialog's code.
import { getSharing } from '@/api/travelApi';
import { prefetch } from '@/utils/data/panelCache';

export const sharingKey = (resource, id) => `sharing:${resource}:${id}`;

/** Fetch the sharing settings now and keep them, unless a fresh copy is here already. */
export function preloadSharing(resource, id) {
  prefetch(sharingKey(resource, id), () => getSharing(resource, id));
}
