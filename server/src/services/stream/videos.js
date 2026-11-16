// Videos in Cloudflare Stream (docs/API.md "Videos"): playback links for a video row,
// keeping a row's state in step with Stream, deleting, and the daily clean-up of Stream
// videos no row points at.
import { streamConfig, streamEnabled } from './streamConfig.js';
import { deleteVideo, getVideo, listVideos } from './streamApi.js';
import { signStreamToken, streamUrls, videoStateFrom } from '../../utils/streamTokens.js';
import { findStreamUidsIn, updateVideoByStreamUid } from '../../domain/photos.js';
import { PHOTO_URL_TTL_SECONDS } from '../../utils/constants/mediaConstants.js';

// An upload link lasts this long; a Stream video with no row is only an orphan after it
export const VIDEO_UPLOAD_HOURS = 6;
const HOUR_MS = 60 * 60 * 1000;

/**
 * A ready video's playback links, signed like the photo links: from the start of the hour
 * for PHOTO_URL_TTL_SECONDS (so a link stays the same for an hour and caches). Null when
 * Stream isn't set up or the row isn't a video.
 */
export function videoPlayback(photo, now = new Date()) {
  if (!photo?.streamUid || !streamEnabled()) return null;
  const { customerCode, signingKeyId, signingKeyPem } = streamConfig();
  const hourStart = new Date(now);
  hourStart.setUTCMinutes(0, 0, 0);
  const token = signStreamToken({
    uid: photo.streamUid,
    keyId: signingKeyId,
    pemBase64: signingKeyPem,
    expiresAt: new Date(hourStart.getTime() + PHOTO_URL_TTL_SECONDS * 1000),
  });
  return streamUrls({ customerCode, token });
}

const durationFrom = (video) => (Number(video?.duration) > 0 ? Math.min(600, Math.max(1, Math.ceil(Number(video.duration)))) : null);

/** What a Stream video's details change on its row. */
const rowUpdateFrom = (video) => ({
  videoState: videoStateFrom(video),
  ...(durationFrom(video) ? { durationS: durationFrom(video) } : {}),
  ...(Number.isSafeInteger(video?.size) && video.size > 0 ? { videoBytes: video.size } : {}),
});

/** A Stream notice (the webhook's body, a video's details): its row follows. -> the count updated */
export const applyStreamNotice = (video) =>
  video?.uid ? updateVideoByStreamUid(video.uid, rowUpdateFrom(video)) : { count: 0 };

/**
 * Ask Stream about a video still processing (when an editor opens it), in case its notice
 * hasn't come (or no webhook is set up). -> the row's new state, or its old one
 */
export async function refreshVideoState(photo) {
  if (!photo?.streamUid || photo.videoState !== 'PROCESSING' || !streamEnabled()) return photo?.videoState;
  try {
    const video = await getVideo(photo.streamUid);
    if (!video) return photo.videoState;
    await applyStreamNotice(video);
    return videoStateFrom(video);
  } catch (err) {
    console.error('[stream] refresh failed:', err.message);
    return photo.videoState;
  }
}

/** Delete a video in Stream after its row has gone; a failure is left for the daily clean-up. */
export async function deleteStreamVideoQuietly(uid) {
  if (!uid || !streamEnabled()) return false;
  try {
    return await deleteVideo(uid);
  } catch (err) {
    console.error('[stream] delete failed, left for the clean-up:', err.message);
    return false;
  }
}

/**
 * The daily clean-up: Stream videos older than an upload link's life that no row points at
 * (an upload never saved, or a video whose row was deleted with its map or account) are
 * deleted. Newest first, a page of up to 1,000 at a time, within `budgetMs`.
 * -> `{ checked, deleted }`, or null when Stream isn't set up
 */
export async function deleteOrphanStreamVideos({ now = new Date(), budgetMs = 20000 } = {}) {
  if (!streamEnabled()) return null;
  const started = Date.now();
  let before = new Date(now.getTime() - VIDEO_UPLOAD_HOURS * HOUR_MS);
  let checked = 0;
  let deleted = 0;
  while (Date.now() - started < budgetMs) {
    const page = await listVideos({ before });
    if (!page.length) break;
    checked += page.length;
    const known = await findStreamUidsIn(page.map((v) => v.uid));
    for (const video of page.filter((v) => !known.has(v.uid))) {
      if (Date.now() - started >= budgetMs) break;
      if (await deleteStreamVideoQuietly(video.uid)) deleted += 1;
    }
    const oldest = page[page.length - 1]?.created;
    if (!oldest || page.length < 1000) break;
    before = new Date(oldest);
  }
  return { checked, deleted };
}
