/**
 * Simple in-memory cache with TTL (Time To Live)
 * Implements stale-while-revalidate pattern
 */
class APICache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Get cached data or null if expired/missing
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const { data, timestamp, ttl } = cached;

    // Check if data is stale (exceeded TTL)
    if (now - timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return data;
  }

  /**
   * Check if cached data exists (even if stale)
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Check if cached data is stale
   */
  isStale(key) {
    const cached = this.cache.get(key);
    if (!cached) return true;

    const now = Date.now();
    return now - cached.timestamp > cached.ttl;
  }

  /**
   * Set cache with TTL (default 5 minutes)
   */
  set(key, data, ttl = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Remove specific cache entry
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get stale data (for stale-while-revalidate pattern)
   */
  getStale(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  /**
   * Track pending requests to prevent duplicate calls
   */
  getPendingRequest(key) {
    return this.pendingRequests.get(key);
  }

  /**
   * Set pending request
   */
  setPendingRequest(key, promise) {
    this.pendingRequests.set(key, promise);
    
    // Clean up after promise resolves/rejects
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return promise;
  }

  /**
   * Remove expired entries (cleanup)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const apiCache = new APICache();

// Cleanup expired entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 10 * 60 * 1000);
}
