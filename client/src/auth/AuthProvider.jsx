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
import { useEffect, useMemo, useState } from 'react';
// Context
import { AuthContext } from './AuthContext';
import { getStoredItem, removeStoredItem } from '@/utils/functions/safeStorage';

const IS_LOGGED_IN_KEY = 'isLoggedIn';

const fail = (e, fallback) => ({ ok: false, error: e?.friendlyMessage || fallback });

export function AuthProvider({ children }) {
  const navigateToPage = useNavigateToPage();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const clearUser = () => {
    removeStoredItem(IS_LOGGED_IN_KEY);
    setUser(null);
    setIsAuthenticated(false);
  };

  // silent: refresh without unmounting guarded pages
  async function refresh({ silent = false } = {}) {
    if (!silent) setLoading(true);

    try {
      const res = await client.get(GET_LOGGED_IN_USER_API, true);
      const u = res?.data?.data?.user || null;

      setUser(u);
      setIsAuthenticated(Boolean(u));
      if (u) localStorage.setItem(IS_LOGGED_IN_KEY, 'true');
      else localStorage.removeItem(IS_LOGGED_IN_KEY);

      return { ok: Boolean(u), user: u };
    } catch (e) {
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

  // Sends a link to the new address; email changes once it's clicked
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

  async function logout() {
    try {
      await client.post(SIGNOUT_API, {}, true);
    } catch (e) {
      console.log('logout:error', e);
    }

    clearUser();
    setLoading(false);
    navigateToPage(HOME_PAGE_URL);
  }

  // Mount only
  useEffect(() => {
    if (getStoredItem(IS_LOGGED_IN_KEY) === 'true') {
      refresh();
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
