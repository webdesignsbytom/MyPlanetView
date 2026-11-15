// When and where a photo was taken, from its EXIF (exifr, loaded only when needed).
// Returns { takenAt, latitude, longitude }, each null when the file doesn't say.
// exifr's lite build (45 kB against 75 kB) reads EXIF and GPS from JPEG, which is where
// phones and cameras write them. It doesn't read PNG; a PNG rarely carries either.
export async function readPhotoMeta(file) {
  const none = { takenAt: null, latitude: null, longitude: null };
  try {
    const { default: exifr } = await import('exifr/dist/lite.esm.mjs');
    const data = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      xmp: false,
      icc: false,
      iptc: false,
      jfif: false,
      ihdr: false,
    });
    if (!data) return none;

    const taken = data.DateTimeOriginal || data.CreateDate || data.DateTime;
    const takenAt = taken instanceof Date && !Number.isNaN(taken.getTime()) ? taken.toISOString() : null;

    const { latitude, longitude } = data;
    // 0,0 is what some cameras write when they had no fix
    const hasGps = Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0);
    return { takenAt, latitude: hasGps ? latitude : null, longitude: hasGps ? longitude : null };
  } catch {
    return none;
  }
}
