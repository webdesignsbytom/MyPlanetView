// Matches the MediaKind enum in schema.prisma (IMAGE / VIDEO / FILE).
export function mediaKindFromContentType(contentType) {
  if (contentType?.startsWith('image/')) return 'IMAGE';
  if (contentType?.startsWith('video/')) return 'VIDEO';
  return 'FILE';
}
