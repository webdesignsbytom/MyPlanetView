// The maps you can open (GET /maps) and the trips shared with you on their own
// (GET /trips/shared-with-me), kept for the session, per signed-in user. MapPage picks your
// default map from a fresh list (which refreshes the copy); the map switcher shows the copy
// at once and asks again in the background, since counts change as you go. Creating,
// renaming, deleting or leaving a map forgets the copy (forgetMapLists).
import { getMyMaps, getTripsSharedWithMe } from '@/api/travelApi';

function sessionList(fetchList) {
  let saved = null; // { userId, list }
  let pending = null; // { userId, promise }
  return {
    peek: (userId) => (saved && saved.userId === userId ? saved.list : null),
    load(userId) {
      if (pending && pending.userId === userId) return pending.promise;
      const promise = fetchList().then(
        (list) => {
          if (pending?.promise === promise) {
            saved = { userId, list };
            pending = null;
          }
          return list;
        },
        (err) => {
          if (pending?.promise === promise) pending = null;
          throw err;
        },
      );
      pending = { userId, promise };
      return promise;
    },
    forget() {
      saved = null;
      pending = null;
    },
  };
}

export const myMaps = sessionList(() => getMyMaps().then(({ maps }) => maps || []));
export const sharedTrips = sessionList(() => getTripsSharedWithMe().then(({ trips }) => trips || []));

/** After a write that adds, renames, removes or leaves a map (or a trip shared with you). */
export function forgetMapLists() {
  myMaps.forget();
  sharedTrips.forget();
}
