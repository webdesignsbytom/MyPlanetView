// Auth
import { useAuth } from '@/auth/AuthContext';

/**
 * Whether the signed-in user still has to verify their email address. Until they do, the
 * server refuses every change to content (countries, trips and stops, photos and their
 * landmarks, new or deleted maps, sharing) with 403; setting a map up, map settings and
 * the account still work (docs/API.md, "Access"). The map and trip pages lock those
 * controls and say why, rather than let something start that will fail.
 */
export default function useMustVerifyEmail() {
  const { user } = useAuth();
  return Boolean(user) && user.emailVerified === false;
}
