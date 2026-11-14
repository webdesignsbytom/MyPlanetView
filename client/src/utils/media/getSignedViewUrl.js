// Api
import client from '../../api/client';
// Constants
import { GET_MEDIA_URL_API } from '../../utils/constants/apiRoutes';

// Signed GET URL for a private object
export async function getSignedViewUrl({ key, ttl = 300 }) {
  if (!key) return { url: null, expiresIn: 0 };

  let url = null;
  let expiresIn = 0;

  await client
    .get(GET_MEDIA_URL_API, true, { params: { key, ttl } })
    .then((res) => {
      url = res?.data?.url || null;
      expiresIn = res?.data?.expiresIn || ttl;
    })
    .catch(() => {
      url = null;
      expiresIn = 0;
    });

  return { url, expiresIn };
}
