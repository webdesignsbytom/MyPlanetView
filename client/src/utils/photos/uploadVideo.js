// One video, end to end (docs/API.md "Videos"; First Class maps only): read its length
// from its boxes, take its location out, draw its poster frames, presign, PUT the three
// files to the private bucket, then confirm. A video keeps no position: it goes in the
// uploader's chosen country (or under Unplaced photos), and no landmark is suggested.
// Every refusal comes before anything is uploaded.
import { createPhoto, presignPhoto } from '@/api/travelApi';
import { VIDEO_MAX_SECONDS } from '@/utils/constants/plans';
import { countryName } from '@/utils/map/countries';
import { LOCKED_MAP, PHOTO_MAX_BYTES, VIDEO_CONTENT_TYPES, VIDEO_MAX_BYTES } from './uploadPhoto';
import { readVideoInfo, stripVideoLocation, videoContentType } from './videoFile';
import { makeVideoPosters } from './videoPoster';
import { putFiles } from './putFile';

export const VIDEOS_ARE_FIRST_CLASS = 'Videos are part of First Class.';
const MB = 1024 * 1024;
const number = (n) => Number(n).toLocaleString('en-GB');

/** "20 of 20 videos of Italy on this map." (the server's checkVideoCap wording) */
export const videoCapMessage = (count, cap, countryCode) =>
  `${number(Math.min(count, cap))} of ${number(cap)} videos of ${countryName(countryCode)} on this map.`;

const tooLong = (maxSeconds) =>
  `This video is over ${maxSeconds % 60 ? `${maxSeconds} seconds` : `${maxSeconds / 60} minutes`} long, the longest a video can be.`;

/**
 * onStage('reading' | 'cleaning' | 'poster' | 'uploading' | 'saving'),
 * onProgress(0..1, { sent, total }) in bytes.
 * `uploadRules` is the map's (`videos` is null below First Class); `videoCount` is the
 * map's videos in `countryCode` now, when known, so a full country is refused at once.
 * Resolves { photo, posterDrawn }; rejects with a message people can read.
 */
export async function uploadVideo({ mapId, tripId, file, countryCode, uploadRules = null, videoCount = null, onStage, onProgress }) {
  if (uploadRules?.locked) throw new Error(LOCKED_MAP);
  const rules = uploadRules?.videos;
  if (!rules) throw new Error(VIDEOS_ARE_FIRST_CLASS);
  const contentType = videoContentType(file);
  const contentTypes = rules.contentTypes || VIDEO_CONTENT_TYPES;
  if (!contentType || !contentTypes.includes(contentType)) throw new Error('Only MP4 and MOV videos can be added.');
  const maxBytes = rules.maxBytes || VIDEO_MAX_BYTES;
  if (file.size > maxBytes) throw new Error(`This video is over ${Math.round(maxBytes / MB)} MB, the largest a video can be.`);
  if (!file.size) throw new Error('This video is empty.');
  const maxSeconds = rules.maxSeconds || VIDEO_MAX_SECONDS;
  if (countryCode && rules.perCountry && videoCount !== null && videoCount >= rules.perCountry) {
    throw new Error(videoCapMessage(videoCount, rules.perCountry, countryCode));
  }

  onStage?.('reading');
  // Refuses a file with no movie box it can read (UncheckableVideoError's message)
  const info = await readVideoInfo(file);
  if (info.seconds !== null && info.durationS > maxSeconds) throw new Error(tooLong(maxSeconds));

  onStage?.('cleaning');
  // The copy that's uploaded: the same bytes, with the location overwritten (or a refusal)
  const cleaned = await stripVideoLocation(file, { type: contentType });

  onStage?.('poster');
  const posters = await makeVideoPosters(cleaned, { seconds: info.seconds });
  // A file whose boxes don't give the length (some fragmented MP4s): the browser's reading
  const seconds = info.seconds ?? posters.frame?.seconds ?? null;
  if (!seconds) throw new Error('This video’s length couldn’t be read, so it wasn’t uploaded.');
  const durationS = Math.max(1, Math.ceil(seconds));
  if (durationS > maxSeconds) throw new Error(tooLong(maxSeconds));
  // The picture as people see it: the browser's frame (the right way up), else the boxes'
  const width = posters.frame?.width || info.width || posters.display.width;
  const height = posters.frame?.height || info.height || posters.display.height;

  const files = [
    { size: 'THUMB', ...posters.thumb },
    { size: 'DISPLAY', ...posters.display },
    { size: 'ORIGINAL', blob: cleaned, contentType, width, height },
  ];
  for (const f of files) {
    f.bytes = f.blob.size;
    if (f.size !== 'ORIGINAL' && f.bytes > PHOTO_MAX_BYTES[f.size]) throw new Error('This video’s poster frame is too large to add.');
  }

  onStage?.('uploading');
  const { photoId, uploads } = await presignPhoto(mapId, {
    kind: 'VIDEO',
    durationS,
    tripId: tripId || undefined,
    countryCode: countryCode || undefined,
    files: files.map((f) => ({ size: f.size, contentType: f.contentType, bytes: f.bytes })),
  });
  const keys = await putFiles(files, uploads, onProgress);

  onStage?.('saving');
  const { photo } = await createPhoto(mapId, {
    photoId,
    kind: 'VIDEO',
    durationS,
    tripId: tripId || undefined,
    takenAt: info.recordedAt || undefined,
    countryCode: countryCode || undefined,
    width,
    height,
    variants: files.map((f) => ({ size: f.size, key: keys[f.size], width: f.width, height: f.height })),
  });
  return { photo, posterDrawn: Boolean(posters.frame) };
}
