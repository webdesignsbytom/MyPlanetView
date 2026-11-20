// Build-time image manifest for `<name>-<width>.<ext>` files

// Vite 7+ deprecation fix: use query/import instead of `as: 'url'`
// Not the home hero's sets: HomeHeroArtwork imports its own files, and through this glob every
// older set (v1, v2: 24 files, 4.3 MB) was emitted into dist unused (19 Nov 2026, the audit)
const allImages = import.meta.glob(['/src/assets/images/**/*.{jpg,jpeg,webp,avif}', '!**/home-hero-*'], {
  eager: true,
  query: '?url',
  import: 'default',
});

// srcSet strings per format (jpg/webp/avif) for a base image name
export function getImageSets(name, { dir = '/src/assets/images' } = {}) {
  // Ensure forward slashes (Vite globs use POSIX style)
  const normalize = (p) => p.replaceAll('\\', '/');

  // Escape for safe regex
  const esc = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

  const safeDir = esc(normalize(dir));
  const safeName = esc(name);

  // Find files like: /src/assets/images/**/${name}-<width>.<ext>
  const matchRe = new RegExp(`${safeDir}.*\\/${safeName}-(\\d+)\\.(jpg|jpeg|webp|avif)$`, 'i');

  const byFormat = { jpg: [], jpeg: [], webp: [], avif: [] };

  for (const [key, url] of Object.entries(allImages)) {
    const k = normalize(key);
    const m = k.match(matchRe);
    if (!m) continue;
    const width = parseInt(m[1], 10);
    const ext = m[2].toLowerCase();
    if (!Number.isFinite(width)) continue;
    if (byFormat[ext]) byFormat[ext].push({ url, width });
  }

  // sort ascending by width
  for (const list of Object.values(byFormat)) list.sort((a, b) => a.width - b.width);

  // build "url widthw" strings
  const toSet = (list) => (list.length ? list.map(i => `${i.url} ${i.width}w`).join(', ') : undefined);

  const jpgSet  = toSet([...byFormat.jpg, ...byFormat.jpeg]);
  const webpSet = toSet(byFormat.webp);
  const avifSet = toSet(byFormat.avif);

  return {
    jpgSet,
    webpSet,
    avifSet,
    byFormat,
    pick(format, prefer) {
      const list = (format === 'jpg' || format === 'jpeg')
        ? [...byFormat.jpg, ...byFormat.jpeg]
        : byFormat[format] || [];
      if (!list.length) return undefined;
      if (!prefer) return list[list.length - 1].url; // largest
      let best = list[0], bestDiff = Math.abs(best.width - prefer);
      for (const item of list) {
        const diff = Math.abs(item.width - prefer);
        if (diff < bestDiff) { best = item; bestDiff = diff; }
      }
      return best.url;
    }
  };
}
