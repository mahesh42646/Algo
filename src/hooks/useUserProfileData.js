import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usersAPI } from '@/utils/api';
import { apiCache } from '@/utils/cache';

const DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes

function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatYMD(value) {
  const d = safeDate(value);
  if (!d) return '—';
  return d.toISOString().split('T')[0];
}

function normalizeUser(user) {
  if (!user) return null;
  const exchangeApis = Array.isArray(user.exchangeApis) ? user.exchangeApis : [];
  const activeApiKeys = exchangeApis.filter((k) => k?.isActive !== false).length;
  const createdAt = user.createdAt || user.created_at || user.joinDate;

  return {
    raw: user,
    id: user.userId || user.id || user._id,
    userId: user.userId,
    name: user.nickname || `User${String(user.userId || '').slice(-6)}` || 'User',
    email: user.email || '—',
    status: user.isActive === false ? 'Inactive' : 'Active',
    joinDate: formatYMD(createdAt),
    lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—',
    accountType: user.subscription?.plan ? String(user.subscription.plan).toUpperCase() : 'Personal',
    apiKeysActive: activeApiKeys,
    referralCode: user.referralCode || '—',
    integrations: exchangeApis,
    // Not present in schema: keep stable UI
    verified: Boolean(user.email),
    twoFactorEnabled: false,
  };
}

export function useUserProfileData(userId, options = {}) {
  const { ttlMs = DEFAULT_TTL_MS } = options;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [referrals, setReferrals] = useState({ referralCode: null, referrals: [] });
  const [strategies, setStrategies] = useState([]);
  const [activities, setActivities] = useState([]);

  const abortRef = useRef({ aborted: false });

  const cacheKeys = useMemo(() => {
    const id = String(userId || '');
    return {
      user: `user:${id}`,
      wallet: `user:${id}:wallet`,
      notifications: `user:${id}:notifications`,
      referrals: `user:${id}:referrals`,
      strategies: `user:${id}:strategies`,
      activities: `user:${id}:activities`,
    };
  }, [userId]);

  const hydrateFromCache = useCallback(() => {
    const cachedUser = apiCache.get(cacheKeys.user);
    const cachedWallet = apiCache.get(cacheKeys.wallet);
    const cachedNotifications = apiCache.get(cacheKeys.notifications);
    const cachedReferrals = apiCache.get(cacheKeys.referrals);
    const cachedStrategies = apiCache.get(cacheKeys.strategies);
    const cachedActivities = apiCache.get(cacheKeys.activities);

    if (cachedUser) setUser(cachedUser);
    if (cachedWallet) setWallet(cachedWallet);
    if (cachedNotifications) setNotifications(cachedNotifications);
    if (cachedReferrals) setReferrals(cachedReferrals);
    if (cachedStrategies) setStrategies(cachedStrategies);
    if (cachedActivities) setActivities(cachedActivities);
  }, [cacheKeys]);

  const fetchWithCache = useCallback(
    async (key, fn) => {
      const pending = apiCache.getPendingRequest(key);
      if (pending) return pending;

      const cached = apiCache.get(key);
      if (cached) return cached;

      const promise = (async () => {
        try {
          const result = await fn();
          if (result?.success !== false) {
            apiCache.set(key, result, ttlMs);
          }
          return result;
        } catch (error) {
          // Return error response instead of throwing to allow partial data loading
          return {
            success: false,
            error: error.message || 'Failed to fetch data',
            status: error.status,
            isNetworkError: error.isNetworkError,
          };
        }
      })();

      return apiCache.setPendingRequest(key, promise);
    },
    [ttlMs]
  );

  const refetch = useCallback(
    async ({ hard = false } = {}) => {
      if (!userId) return;
      abortRef.current.aborted = false;

      try {
        setError(null);
        if (hard) setLoading(true);

        if (hard) {
          Object.values(cacheKeys).forEach((k) => apiCache.delete(k));
        } else {
          hydrateFromCache();
        }

        const [
          userResp,
          walletResp,
          notificationsResp,
          referralsResp,
          strategiesResp,
          activitiesResp,
        ] = await Promise.all([
          fetchWithCache(cacheKeys.user, () => usersAPI.getById(userId)),
          fetchWithCache(cacheKeys.wallet, () => usersAPI.getWallet(userId)),
          fetchWithCache(cacheKeys.notifications, () => usersAPI.getNotifications(userId)),
          fetchWithCache(cacheKeys.referrals, () => usersAPI.getReferrals(userId)),
          fetchWithCache(cacheKeys.strategies, () => usersAPI.getStrategies(userId)),
          fetchWithCache(cacheKeys.activities, () => usersAPI.getActivities(userId)),
        ]);

        if (abortRef.current.aborted) return;

        // Handle user response (critical - show error if fails)
        if (userResp?.success) {
          setUser(normalizeUser(userResp.data));
        } else {
          const errorMsg = userResp?.error || userResp?.message || 'Failed to load user';
          setError(errorMsg);
          // Still try to load other data if user fails
        }

        // Handle other responses (non-critical - load if available, don't fail if missing)
        if (walletResp?.success) {
          setWallet(walletResp.data || null);
        } else if (walletResp?.isNetworkError) {
          console.warn('Failed to load wallet data:', walletResp.error);
        }

        if (notificationsResp?.success) {
          setNotifications(Array.isArray(notificationsResp.data) ? notificationsResp.data : []);
        } else if (notificationsResp?.isNetworkError) {
          console.warn('Failed to load notifications:', notificationsResp.error);
        }

        if (referralsResp?.success) {
          setReferrals(referralsResp.data || { referralCode: null, referrals: [] });
        } else if (referralsResp?.isNetworkError) {
          console.warn('Failed to load referrals:', referralsResp.error);
        }

        if (strategiesResp?.success) {
          setStrategies(Array.isArray(strategiesResp.data) ? strategiesResp.data : []);
        } else if (strategiesResp?.isNetworkError) {
          console.warn('Failed to load strategies:', strategiesResp.error);
        }

        if (activitiesResp?.success) {
          setActivities(Array.isArray(activitiesResp.data) ? activitiesResp.data : []);
        } else if (activitiesResp?.isNetworkError) {
          console.warn('Failed to load activities:', activitiesResp.error);
        }
      } catch (e) {
        if (!abortRef.current.aborted) {
          const errorMsg = e?.message || e?.error || 'Failed to load user data';
          setError(errorMsg);
          console.error('Error in refetch:', e);
        }
      } finally {
        if (!abortRef.current.aborted) setLoading(false);
      }
    },
    [cacheKeys, fetchWithCache, hydrateFromCache, userId]
  );

  useEffect(() => {
    abortRef.current.aborted = false;
    setLoading(true);
    setError(null);
    setUser(null);
    setWallet(null);
    setNotifications([]);
    setReferrals({ referralCode: null, referrals: [] });
    setStrategies([]);
    setActivities([]);

    if (!userId) {
      setLoading(false);
      setError('User ID not found');
      return () => {};
    }

    refetch({ hard: false });

    return () => {
      abortRef.current.aborted = true;
    };
  }, [userId, refetch]);

  return {
    loading,
    error,
    user,
    wallet,
    notifications,
    referrals,
    strategies,
    activities,
    refetch,
  };
}

