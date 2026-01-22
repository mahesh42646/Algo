/**
 * Admin Authentication Utility
 * Handles authentication state, session management, and persistence
 */

const AUTH_KEY = 'adminAuth';
const AUTH_EXPIRY_KEY = 'adminAuthExpiry';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated and session is valid
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  
  const auth = localStorage.getItem(AUTH_KEY);
  const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);
  
  if (!auth || auth !== 'true') return false;
  
  // Check if session has expired
  if (expiry) {
    const expiryTime = parseInt(expiry, 10);
    if (Date.now() > expiryTime) {
      // Session expired, clear auth
      clearAuth();
      return false;
    }
  }
  
  return true;
}

/**
 * Set authentication state
 * @param {boolean} value - Authentication status
 */
export function setAuth(value) {
  if (typeof window === 'undefined') return;
  
  if (value) {
    localStorage.setItem(AUTH_KEY, 'true');
    // Set expiry time (24 hours from now)
    const expiryTime = Date.now() + SESSION_DURATION;
    localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
  } else {
    clearAuth();
  }
}

/**
 * Clear authentication state
 */
export function clearAuth() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_EXPIRY_KEY);
}

/**
 * Get remaining session time in milliseconds
 * @returns {number} Remaining time in ms, or 0 if expired/not authenticated
 */
export function getRemainingSessionTime() {
  if (typeof window === 'undefined') return 0;
  
  const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);
  if (!expiry) return 0;
  
  const expiryTime = parseInt(expiry, 10);
  const remaining = expiryTime - Date.now();
  return Math.max(0, remaining);
}

/**
 * Extend session (refresh expiry time)
 */
export function extendSession() {
  if (typeof window === 'undefined') return;
  
  if (isAuthenticated()) {
    const expiryTime = Date.now() + SESSION_DURATION;
    localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
  }
}
