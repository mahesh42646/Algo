import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, setAuth, clearAuth, extendSession } from '@/utils/auth';

/**
 * Custom hook for admin authentication
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAuth - If true, redirects to login if not authenticated
 * @param {string} options.redirectTo - Where to redirect if not authenticated (default: '/admin')
 * @param {boolean} options.redirectIfAuthenticated - If true, redirects authenticated users (for login page)
 * @param {string} options.redirectIfAuthTo - Where to redirect if authenticated (default: '/admin/dashboard')
 * @returns {Object} Auth state and methods
 */
export function useAuth(options = {}) {
  const {
    requireAuth = false,
    redirectTo = '/admin',
    redirectIfAuthenticated = false,
    redirectIfAuthTo = '/admin/dashboard',
  } = options;

  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const authStatus = isAuthenticated();
      setAuthenticated(authStatus);
      setLoading(false);

      // Extend session on activity
      if (authStatus) {
        extendSession();
      }

      // Handle redirects
      if (requireAuth && !authStatus) {
        router.push(redirectTo);
      } else if (redirectIfAuthenticated && authStatus) {
        router.push(redirectIfAuthTo);
      }
    };

    checkAuth();

    // Check auth on storage changes (e.g., logout in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'adminAuth' || e.key === 'adminAuthExpiry') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Extend session on user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (isAuthenticated()) {
        extendSession();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [requireAuth, redirectTo, redirectIfAuthenticated, redirectIfAuthTo, router]);

  const login = (email, password) => {
    // Simple credential check (in production, this should be an API call)
    if (email === 'admin@dashboard.com' && password === 'admin123') {
      setAuth(true);
      setAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const logout = () => {
    clearAuth();
    setAuthenticated(false);
    router.push('/admin');
  };

  return {
    authenticated,
    loading,
    login,
    logout,
    isAuthenticated: () => isAuthenticated(),
  };
}
