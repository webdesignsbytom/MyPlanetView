import axios from 'axios';
// Constants
import { API_TIMEOUT } from '@/utils/constants/constants';

const host = import.meta.env.VITE_API_URL;

// Build Cookie Auth config (Better Auth session cookie)
const getAuthConfig = () => ({ withCredentials: true });

// Merge helper
const mergeHeaders = (base = {}, extra = {}) => ({ ...base, ...extra });

// Normalized error handler
const handleError = (error) => {
  let friendlyMessage = 'An unexpected error occurred.';

  if (error.response) {
    const { status, data } = error.response;
    if (data && data.message) {
      friendlyMessage = data.message;
    } else {
      switch (status) {
        case 401:
          friendlyMessage = 'Unauthorized - Please check your credentials.';
          break;
        case 403:
          friendlyMessage = 'Forbidden - You do not have access.';
          break;
        case 404:
          friendlyMessage = 'Resource not found.';
          break;
        default:
          friendlyMessage = 'An unexpected server error occurred.';
      }
    }
  } else if (error.request) {
    friendlyMessage = 'No response from the server. Please try again.';
  } else {
    friendlyMessage = error.message;
  }

  error.friendlyMessage = friendlyMessage;
  return Promise.reject(error);
};

// Single Axios instance (exported only so dev mock mode can answer its requests)
const http = axios.create({
  baseURL: host,
  timeout: API_TIMEOUT,
});
export const httpClient = http;

// Core request helper — always returns the **full response**
const request = async (
  method,
  path,
  { data, withAuth = true, config = {} } = {},
) => {
  const authConfig = withAuth ? getAuthConfig() : {};
  const headers = mergeHeaders({}, config.headers || {});

  try {
    return await http.request({
      url: path,
      method,
      data,
      ...config,
      ...authConfig, // <- enables cookie sending when withAuth=true
      headers,
    });
  } catch (err) {
    return handleError(err);
  }
};

const client = {
  get: (path, withAuth = true, config = {}) =>
    request('GET', path, { withAuth, config }),

  post: (path, data, withAuth = true, config = {}) =>
    request('POST', path, { data, withAuth, config }),

  patch: (path, data, withAuth = true, config = {}) =>
    request('PATCH', path, { data, withAuth, config }),

  put: (path, data, withAuth = true, config = {}) =>
    request('PUT', path, { data, withAuth, config }),

  delete: (path, withAuth = true, config = {}) =>
    request('DELETE', path, { withAuth, config }),
};

export default client;