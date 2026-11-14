// Api
import client from '../../api/client';
// Constants
import { DELETE_MEDIA_OBJECT_API } from '../../utils/constants/apiRoutes';

// Hard-delete an object from the bucket by key
export async function deleteMediaObject({ key }) {
  if (!key) return { ok: false };

  let ok = false;

  await client
    .delete(DELETE_MEDIA_OBJECT_API, true, { params: { key } })
    .then(() => {
      ok = true;
    })
    .catch(() => {
      ok = false;
    });

  return { ok };
}
