import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// Constants
import { LOGIN_PAGE_URL, HOME_PAGE_URL } from '../constants/routes';
// Auth
import { useAuth } from '../../auth/AuthContext';
import { hasRole, ROLES } from './permissions';
// Components
import LoadingSpinner from '@/components/utils/LoadingSpinner';

function GuardSpinner() {
  return (
    <div className='grid place-items-center min-h-screen' role='status'>
      <LoadingSpinner md />
      <span className='sr-only'>Loading…</span>
    </div>
  );
}

// Normal auth guard (login returns you here)
export function AuthenticateUser({ children, redirectPath = LOGIN_PAGE_URL }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <GuardSpinner />;

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectPath} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

// Admin guard
export function AuthenticateAdmin({ children, redirectPath = HOME_PAGE_URL }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <GuardSpinner />;

  if (!isAuthenticated || !user) {
    return <Navigate to={LOGIN_PAGE_URL} replace state={{ from: location.pathname }} />;
  }

  // Admin or developer only
  if (!hasRole(user, ROLES.ADMIN, ROLES.DEVELOPER)) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

// Developer guard
export function AuthenticateDeveloper({ children, redirectPath = HOME_PAGE_URL }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <GuardSpinner />;

  if (!isAuthenticated || !user) {
    return <Navigate to={LOGIN_PAGE_URL} replace state={{ from: location.pathname }} />;
  }

  if (!hasRole(user, ROLES.DEVELOPER)) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
