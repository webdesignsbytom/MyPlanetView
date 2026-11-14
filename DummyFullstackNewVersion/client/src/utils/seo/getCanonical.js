import { FULL_BUSINESS_URL } from '../constants/constants';
export default function getCanonical(pathname = '/') {
  const base = FULL_BUSINESS_URL.replace(/\/$/, '');
  const path = `/${String(pathname || '').replace(/^\//, '')}`.replace(/\/{2,}/g, '/');
  return base + (path === '/' ? '/' : path.replace(/\/+$/, '')); // normalize trailing slash
}