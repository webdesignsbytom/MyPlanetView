// Api
import client from '@/api/client';
// Hooks
import useNavigateToPage from '@/hooks/useNavigateToPage';
// Constants
import {
  GET_LOGGED_IN_USER_API,
  LOGIN_EMAIL_API,
  REGISTER_API,
  SIGNOUT_API,
  RESET_PASSWORD_API,
  VERIFY_EMAIL_API,
  SEND_VERIFICATION_EMAIL_API,
  CHANGE_EMAIL_API,
  CHANGE_PASSWORD_API,
  UPDATE_USER_API,
  REVOKE_OTHER_SESSIONS_API,
  DELETE_ACCOUNT_API,
  CHANGE_OR_ADD_AVATAR_API,
  REMOVE_AVATAR_API,
} from '@/utils/constants/apiRoutes';
import { HOME_PAGE_URL } from '@/utils/constants/routes';
// Utils
import { presignAndUpload } from '@/utils/media/uploadViaMediaService';
// React
import { useEffect, useMemo, useRef, useState } from 'react';
// Context
import { AuthContext } from './AuthContext';
import { IS_LOGGED_IN_KEY, takeSessionRequest } from './bootSession';
import { getStoredItem, removeStoredItem, setStoredItem } from '@/utils/functions/safeStorage';

const fail = (e, fallback) => ({ ok: false, error: e?.friendlyMessage || fallback });

// While the address is unverified, the session is read again when the tab comes back, at
// most this often (the person may have clicked the emailed link in another tab)
const UNVERIFIED_RECHECK_MS = 10000;

export function AuthProvider({ children }) {
  const navigateToPage = useNavigateToPage();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // When the session was last read; reads are numbered so a slow, older answer (the boot
  // request, say, after the verify page's fresh read) never replaces a newer one
  const lastSessionRead = useRef(0);
  const readCount = useRef(0);
  const appliedRead = useRef(0);

  const clearUser = () => {
    removeStoredItem(IS_LOGGED_IN_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  // silent: refresh without unmounting guarded pages. request: one already sent (the
  // session request main.jsx starts at boot). background: a check nobody asked for, so a
  // failure other than a 401 (offline, a server error) leaves the session as it was
  async function refresh({ silent = false, request = null, background = false } = {}) {
    if (!silent) setLoading(true);
    lastSessionRead.current = Date.now();
    const read = ++readCount.current;

    try {
      const res = await (request || client.get(GET_LOGGED_IN_USER_API, true));
      const u = res?.data?.data?.user || null;
      if (read < appliedRead.current) return { ok: Boolean(u), user: u };
      appliedRead.current = read;

      setUser(u);
      setIsAuthenticated(Boolean(u));
      if (u) setStoredItem(IS_LOGGED_IN_KEY, 'true');
      else removeStoredItem(IS_LOGGED_IN_KEY);

      return { ok: Boolean(u), user: u };
    } catch (e) {
      if (read < appliedRead.current) return fail(e, 'Not signed in.');
      if (background && e?.response?.status !== 401) return fail(e, 'Not signed in.');
      appliedRead.current = read;
      clearUser();
      return fail(e, 'Not signed in.');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // rememberMe false = session ends when the browser closes
  async function login(email, password, rememberMe = true) {
    try {
      await client.post(LOGIN_EMAIL_API, { email, password, rememberMe }, true);
      return await refresh();
    } catch (e) {
      clearUser();
      setLoading(false);
      return fail(e, 'Unable to sign in.');
    }
  }

  // Sign-up signs the user in and sends a verification email
  async function register(registerFormData) {
    try {
      await client.post(
        REGISTER_API,
        {
          email: registerFormData.email,
          password: registerFormData.password,
          name: registerFormData.username,
        },
        true,
      );
      await refresh();
      return { ok: true };
    } catch (e) {
      return fail(e, 'Unable to register.');
    }
  }

  async function resetPassword({ token, password }) {
    try {
      await client.post(RESET_PASSWORD_API, { token, newPassword: password }, false);
      return { ok: true };
    } catch (e) {
      return fail(e, 'Unable to reset password.');
    }
  }

  async function verifyEmail(token) {
    try {
      await client.get(`${VERIFY_EMAIL_API}?token=${encodeURIComponent(token)}`, true);
      // Verifying can sign the user in
      const session = await refresh({ silent: true });
      return { ok: true, signedIn: session.ok };
    } catch (e) {
      return fail(e, 'Unable to verify email.');
    }
  }

  async function resendVerificationEmail() {
    try {
      await client.post(SEND_VERIFICATION_EMAIL_API, { email: user?.email }, true);
      return { ok: true };
    } catch (e) {
      return fail(e, 'Unable to send verification email.');
    }
  }

  // A verified account confirms from its current address first; then a link goes to the
  // new address, and the email changes once it's clicked
  async function changeEmail({ newEmail }) {
    try {
      await client.post(CHANGE_EMAIL_API, { newEmail }, true);
      return { ok: true };
    } catch (e) {
      return fail(e, 'Unable to change email.');
    }
  }

  async function changePassword({ currentPassword, newPassword, revokeOtherSessions = false }) {
    try {
      await client.post(
        CHANGE_PASSWORD_API,
        { currentPassword, newPassword, revokeOtherSessions },
        true,
      );
      return { ok: true };
    } catch (e) {
      return fail(e, 'Unable to change password.');
    }
  }

  async function updateName(name) {
    try {
      await client.post(UPDATE_USER_API, { name }, true);
      await refresh({ silent: true });
      return { ok: true };
    } catch (e) {
      return fail(e, 'Unable to update your name.');
    }
  }

  async function updateAvatar(file) {
    try {
      const { key } = await presignAndUpload({ resource: 'avatar', file, filename: file.name });
      await client.post(CHANGE_OR_ADD_AVATAR_API, { key }, true);
      await refresh({ silent: true });
      return { ok: true };
    } catch (e) {
      return fail(e, 'Unable to update your avatar.');
    }
  }

  async function removeAvatar() {
    try {
      await client.delete(REMOVE_AVATAR_API, true);
      await refresh({ silent: true });
      return { ok: true };
    } catch (e) {
      return fail(e, 'Unable to remove your avatar.');
    }
  }

  async function revokeOtherSessions() {
    try {
      await client.post(REVOKE_OTHER_SESSIONS_API, {}, true);
      return { ok: true };
    } catch (e) {
      return fail(e, 'Unable to sign out other devices.');
    }
  }

  async function deleteAccount(password) {
    try {
      await client.post(DELETE_ACCOUNT_API, { password }, true);
      clearUser();
      navigateToPage(HOME_PAGE_URL);
      return { ok: true };
    } catch (e) {
      return fail(e, 'Unable to delete your account.');
    }
  }

  // Signed out only once the server says so: if the call fails, the session cookie is
  // still good, so the page keeps showing the person as signed in and says it failed.
  // A 401 means the session had already ended.
  async function logout() {
    try {
      await client.post(SIGNOUT_API, {}, true);
    } catch (e) {
      if (e?.response?.status !== 401) {
        return { ok: false, error: "Logging out didn't work, so you're still logged in. Please try again." };
      }
    }

    clearUser();
    setLoading(false);
    navigateToPage(HOME_PAGE_URL);
    return { ok: true };
  }

  // Signed in but not verified: when this tab is focused or shown again, read the session
  // (throttled), so that verifying from the emailed link in another tab lifts this tab's
  // banner and locks without a reload
  const awaitingVerification = Boolean(user) && user.emailVerified === false;
  useEffect(() => {
    if (!awaitingVerification) return undefined;
    const recheck = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastSessionRead.current < UNVERIFIED_RECHECK_MS) return;
      refresh({ silent: true, background: true });
    };
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingVerification]);

  // Mount only. The first render is the signed-out one, as on the pre-rendered pages
  // (hydration needs it to match); the session arrives after.
  useEffect(() => {
    const request = takeSessionRequest();
    if (request || getStoredItem(IS_LOGGED_IN_KEY) === 'true') {
      refresh({ request });
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Methods only depend on this state
  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      refresh,
      login,
      register,
      resetPassword,
      verifyEmail,
      resendVerificationEmail,
      changeEmail,
      changePassword,
      updateName,
      updateAvatar,
      removeAvatar,
      revokeOtherSessions,
      deleteAccount,
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
