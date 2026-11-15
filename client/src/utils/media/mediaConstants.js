// The server's cap for avatars and contact images (server MEDIA_CFG maxBytes)
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_ATTACHMENT_SIZE_MB = 10;
export const MAX_VIDEO_SIZE_MB = 20;
// The only image types the generic uploads take (server utils/media/uploadRules.js)
export const UPLOAD_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const IMAGE_ACCEPT = UPLOAD_IMAGE_TYPES.join(',');
export const VIDEO_ACCEPT = 'video/*';
