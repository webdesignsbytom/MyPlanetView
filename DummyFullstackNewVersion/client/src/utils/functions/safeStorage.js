// Browsers that block site data (Chrome/Firefox "block all cookies and site
// data", Safari "Block All Cookies") throw a SecurityError as soon as storage
// is touched. Uncaught, that crashes the whole app to a blank page, so every
// storage call goes through these helpers instead.

export function getStoredItem(key, type = 'localStorage') {
  try {
    return window[type].getItem(key);
  } catch {
    return null;
  }
}

export function setStoredItem(key, value, type = 'localStorage') {
  try {
    window[type].setItem(key, value);
  } catch {
    // Storage blocked or full: the value only lasts for this page view.
  }
}

export function removeStoredItem(key, type = 'localStorage') {
  try {
    window[type].removeItem(key);
  } catch {
    // Storage blocked: nothing was stored, so nothing to remove.
  }
}
