import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardAPI } from '@/utils/api';
import { apiCache } from '@/utils/cache';

/**
 * Custom hook for dashboard data with caching and stale-while-revalidate
 * Implements best practices:
 * - Request deduplication
 * - Stale-while-revalidate pattern
 * - Automatic refetching on focus
 * - Error retry logic
 */
export function useDashboardData(options = {}) {
  const {
    refetchInterval = 5 * 60 * 1000, // 5 minutes default
    cacheTTL = 5 * 60 * 1000, // 5 minutes cache
    enableRefetchOnFocus = true,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [stats, setStats] = useState({
    totalUsers: 0,
    activePlans: 0,
    revenue: 0,
    activeUsers: 0,
  });
  const [growth, setGrowth] = useState({
    totalUsers: '+0%',
    activePlans: '+0%',
    revenue: '+0%',
    activeUsers: '+0%',
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  /**
   * Fetch dashboard stats with retry logic
   */
  const fetchStats = useCallback(async (retries = retryCount) => {
    const cacheKey = 'dashboard:stats';
    
    // Check for pending request (deduplication)
    const pendingRequest = apiCache.getPendingRequest(cacheKey);
    if (pendingRequest) {
      try {
        const result = await pendingRequest;
        if (result.success) {
          setStats(result.data);
          setGrowth(result.data.growth || {});
          setError(null);
        }
        return result;
      } catch (err) {
        // Continue to fetch if pending request fails
      }
    }

    // Check cache for stale data (stale-while-revalidate)
    const staleData = apiCache.getStale(cacheKey);
    if (staleData && !apiCache.isStale(cacheKey)) {
      // Use fresh cached data immediately
      setStats(staleData.data);
      setGrowth(staleData.data.growth || {});
      setError(null);
      setLoading(false);
    } else if (staleData) {
      // Use stale data while fetching fresh data
      setStats(staleData.data);
      setGrowth(staleData.data.growth || {});
      setIsRefreshing(true);
    }

    try {
      // Create abort controller for request cancellation
      abortControllerRef.current = new AbortController();

      // Create fetch promise
      const fetchPromise = dashboardAPI.getStats();
      
      // Track pending request
      const requestPromise = apiCache.setPendingRequest(cacheKey, fetchPromise);

      const response = await requestPromise;

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return null;
      }

      if (response.success) {
        // Update cache
        apiCache.set(cacheKey, response, cacheTTL);
        
        // Update state
        setStats(response.data);
        setGrowth(response.data.growth || {});
        setError(null);
        setIsRefreshing(false);
        setLoading(false);
        
        return response;
      } else {
        throw new Error(response.error || 'Failed to fetch stats');
      }
    } catch (err) {
      // Retry logic
      if (retries > 0 && !abortControllerRef.current?.signal.aborted) {
        retryTimeoutRef.current = setTimeout(() => {
          return fetchStats(retries - 1);
        }, retryDelay);
        return null;
      }

      // All retries failed
      setError(err.message || 'Failed to load statistics');
      setIsRefreshing(false);
      setLoading(false);
      
      // Return stale data if available
      if (staleData) {
        return { success: true, data: staleData };
      }
      
      return { success: false, error: err.message };
    }
  }, [cacheTTL, retryCount, retryDelay]);

  /**
   * Fetch recent users with retry logic
   */
  const fetchRecentUsers = useCallback(async (limit = 5, retries = retryCount) => {
    const cacheKey = `dashboard:recentUsers:${limit}`;
    
    // Check for pending request
    const pendingRequest = apiCache.getPendingRequest(cacheKey);
    if (pendingRequest) {
      try {
        const result = await pendingRequest;
        if (result.success) {
          setRecentUsers(result.data || []);
        }
        return result;
      } catch (err) {
        // Continue to fetch if pending request fails
      }
    }

    // Check cache
    const staleData = apiCache.getStale(cacheKey);
    if (staleData && !apiCache.isStale(cacheKey)) {
      setRecentUsers(staleData || []);
      return { success: true, data: staleData };
    } else if (staleData) {
      setRecentUsers(staleData || []);
      setIsRefreshing(true);
    }

    try {
      const fetchPromise = dashboardAPI.getRecentUsers(limit);
      const requestPromise = apiCache.setPendingRequest(cacheKey, fetchPromise);

      const response = await requestPromise;

      if (abortControllerRef.current?.signal.aborted) {
        return null;
      }

      if (response.success) {
        apiCache.set(cacheKey, response.data, cacheTTL);
        setRecentUsers(response.data || []);
        setIsRefreshing(false);
        return response;
      } else {
        throw new Error(response.error || 'Failed to fetch recent users');
      }
    } catch (err) {
      if (retries > 0 && !abortControllerRef.current?.signal.aborted) {
        retryTimeoutRef.current = setTimeout(() => {
          return fetchRecentUsers(limit, retries - 1);
        }, retryDelay);
        return null;
      }

      setIsRefreshing(false);
      
      if (staleData) {
        return { success: true, data: staleData };
      }
      
      return { success: false, error: err.message };
    }
  }, [cacheTTL, retryCount, retryDelay]);

  /**
   * Fetch all dashboard data
   */
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchStats(),
        fetchRecentUsers(5),
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchRecentUsers]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    // Clear cache for fresh data
    apiCache.delete('dashboard:stats');
    apiCache.delete('dashboard:recentUsers:5');
    return fetchDashboardData();
  }, [fetchDashboardData]);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []); // Only run on mount

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, fetchDashboardData]);

  // Refetch on window focus (if enabled)
  useEffect(() => {
    if (!enableRefetchOnFocus) return;

    const handleFocus = () => {
      // Only refetch if data is stale
      if (apiCache.isStale('dashboard:stats') || apiCache.isStale('dashboard:recentUsers:5')) {
        fetchDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [enableRefetchOnFocus, fetchDashboardData]);

  return {
    stats,
    growth,
    recentUsers,
    loading,
    error,
    isRefreshing,
    refresh,
    refetch: fetchDashboardData,
  };
}
