// A phone held either way: narrow, or short, as a phone on its side is. The same test as the
// `phone:` and `nophone:` variants in styles/index.css (keep the two in step), for code
// that decides by it (useMediaQuery).
export const PHONE_QUERY = '(max-width: 767.98px), (max-height: 499.98px)';
export const NOT_PHONE_QUERY = '(min-width: 768px) and (min-height: 500px)';
