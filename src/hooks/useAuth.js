import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, setAuth, clearAuth, extendSession, getAuthToken } from '@/utils/auth';
import { adminAPI } from '@/utils/api';

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

  const login = async (username, password) => {
    try {
      const response = await adminAPI.login(username, password);
      
      if (response.success && response.data && response.data.token) {
        // Store authentication token
        setAuth(true, response.data.token);
        setAuthenticated(true);
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Invalid username or password' 
      };
    }
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
