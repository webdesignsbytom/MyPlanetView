# Server

Express 5 API (Prisma 7 / Postgres, better-auth, S3-compatible storage, email through Resend), deployed to Vercel. Setup and commands are in the root `README.md`; architecture notes are in `CLAUDE.md`.

## Uploads

A client upload names a `resource`, which must be a key in `MEDIA_CFG` (`src/services/s3/mediaService.js`). The key sets the S3 prefix (always under `BucketNamespace`), visibility, whether sign-in is needed, and the allowed file types:

```js
export const MEDIA_CFG = {
  avatar: { prefix: `${BucketNamespace}/avatars/`, visibility: 'public', requiresAuth: true /* ... */ },
  contact: { prefix: `${BucketNamespace}/contact/`, visibility: 'public', requiresAuth: false /* ... */ },
};
```

```js
// client
await presignAndUpload({ resource: 'contact', file, filename: file.name, contentType: file.type });
```

The upload is then confirmed (`/confirm-upload` checks the size S3 reports), and only confirmed uploads of the same resource are accepted by a form. Uploads that nothing references are deleted daily (`npm run media:cleanup` runs the same job by hand).

## Travel photos

Photos don't use the generic `/api/media-services` routes (which refuse `photo` keys); they go through the photo routes, which check map and trip roles (`docs/API.md`, "Photos").

- **Where they're stored:** the **private** bucket (`STORAGE_PRIVATE_*`, each falling back to its `STORAGE_*` twin), under `<BucketNamespace>/photos/<mapId>/<photoId>/`.
- **Three files per photo:**
  - a thumbnail and a display copy, both made in the browser with the location data removed;
  - the original as uploaded.
- **How they're viewed:** only through signed URLs, signed at the start of the hour and valid for two hours.
- **Clean-up:**
  - deleting a photo, a map or an account deletes the files;
  - uploads that were presigned but never saved go with the daily orphan clean-up after 24 hours;
  - the same cron also removes finished rate-limit windows.

The browser uploads straight to the private bucket, so that bucket needs CORS for the site's origins (`PUT`, `GET`). See below.

## Bucket CORS

Run these yourself: they print the bucket's endpoint, region and name.

```bash
node ./src/services/s3/checkBucketCors.js
node ./src/services/s3/addBucketCorsOrigin.js   # edit its origin list first
node ./src/services/s3/setPrivateBucketCors.js  # private bucket (photos), from FRONTEND_ORIGIN
```
