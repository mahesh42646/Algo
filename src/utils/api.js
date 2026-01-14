import { env } from '@/config/env';

const API_BASE_URL = env.BACKEND_URL;

/**
 * Generic API fetch function with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Dashboard API functions
 */
export const dashboardAPI = {
  /**
   * Get dashboard statistics
   */
  async getStats() {
    try {
      const [usersResponse, referralsResponse] = await Promise.all([
        fetchAPI('/users'),
        fetchAPI('/users').catch(() => ({ success: true, data: [] })),
      ]);

      const users = usersResponse.success ? usersResponse.data : [];
      
      // Calculate stats from users data
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.isActive !== false).length;
      
      // Count users by plan
      const planCounts = users.reduce((acc, user) => {
        const plan = user.subscription?.plan || 'free';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      }, {});

      const activePlans = Object.keys(planCounts).filter(plan => plan !== 'free').reduce((sum, plan) => sum + (planCounts[plan] || 0), 0);
      
      // Calculate revenue (mock calculation - adjust based on your business logic)
      const revenue = users.reduce((sum, user) => {
        const plan = user.subscription?.plan || 'free';
        const planPrices = {
          'free': 0,
          'basic': 9.99,
          'premium': 29.99,
          'enterprise': 59.99
        };
        return sum + (planPrices[plan] || 0);
      }, 0);

      // Calculate growth percentages (mock - you can implement real calculation)
      const calculateGrowth = (current, previous = current * 0.9) => {
        const change = ((current - previous) / previous) * 100;
        return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
      };

      return {
        success: true,
        data: {
          totalUsers,
          activePlans,
          revenue: Math.round(revenue),
          activeUsers,
          growth: {
            totalUsers: calculateGrowth(totalUsers),
            activePlans: calculateGrowth(activePlans),
            revenue: calculateGrowth(revenue),
            activeUsers: calculateGrowth(activeUsers),
          }
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        error: error.message,
        data: {
          totalUsers: 0,
          activePlans: 0,
          revenue: 0,
          activeUsers: 0,
          growth: {
            totalUsers: '+0%',
            activePlans: '+0%',
            revenue: '+0%',
            activeUsers: '+0%',
          }
        }
      };
    }
  },

  /**
   * Get recent users
   */
  async getRecentUsers(limit = 5) {
    try {
      const response = await fetchAPI('/users');
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch users');
      }

      const users = response.data || [];
      
      const planMap = {
        'premium': 'Premium',
        'enterprise': 'Pro',
        'basic': 'Basic',
        'free': 'Basic'
      };

      const recentUsers = users
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, limit)
        .map((user) => ({
          id: user.id || user._id,
          userId: user.userId,
          name: user.nickname || `User${user.userId?.slice(-6) || ''}`,
          email: user.email,
          plan: planMap[user.subscription?.plan] || 'Basic',
          joinDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        }));

      return {
        success: true,
        data: recentUsers
      };
    } catch (error) {
      console.error('Error fetching recent users:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
};

/**
 * Users API functions
 */
export const usersAPI = {
  /**
   * Get all users
   */
  async getAll() {
    return fetchAPI('/users');
  },

  /**
   * Get user by ID
   */
  async getById(userId) {
    return fetchAPI(`/users/${userId}`);
  },

  /**
   * Get user referrals
   */
  async getReferrals(userId) {
    return fetchAPI(`/users/${userId}/referrals`);
  },

  /**
   * Get user notifications
   */
  async getNotifications(userId) {
    return fetchAPI(`/users/${userId}/notifications`);
  },

  /**
   * Update user
   */
  async update(userId, data) {
    return fetchAPI(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
};

/**
 * Referrals API functions
 */
export const referralsAPI = {
  /**
   * Get all referrals data
   */
  async getAll() {
    try {
      const usersResponse = await fetchAPI('/users');
      if (!usersResponse.success) {
        throw new Error(usersResponse.error || 'Failed to fetch users');
      }

      const users = usersResponse.data || [];
      
      // Aggregate referral data
      const referralsData = [];
      
      for (const user of users) {
        if (user.referrals && user.referrals.length > 0) {
          for (const referral of user.referrals) {
            // Find referred user details
            const referredUser = users.find(u => u.userId === referral.userId);
            
            referralsData.push({
              id: referral.userId || Math.random().toString(),
              referrerId: user.userId,
              referrerName: user.nickname || `User${user.userId?.slice(-6)}`,
              referrerEmail: user.email,
              referralCode: user.referralCode,
              referredUserId: referral.userId,
              referredUserName: referredUser?.nickname || `User${referral.userId?.slice(-6)}`,
              referredUserEmail: referredUser?.email || 'N/A',
              referredAt: referral.referredAt || new Date(),
              status: referredUser?.isActive ? 'Active' : 'Pending',
            });
          }
        }
      }

      // Sort by most recent
      referralsData.sort((a, b) => new Date(b.referredAt) - new Date(a.referredAt));

      return {
        success: true,
        data: referralsData
      };
    } catch (error) {
      console.error('Error fetching referrals:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * Get referral statistics
   */
  async getStats() {
    try {
      const referralsResponse = await this.getAll();
      if (!referralsResponse.success) {
        throw new Error(referralsResponse.error);
      }

      const referrals = referralsResponse.data || [];
      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(r => r.status === 'Active').length;
      const pendingReferrals = totalReferrals - activeReferrals;

      // Get unique referrers
      const uniqueReferrers = new Set(referrals.map(r => r.referrerId));
      const totalReferrers = uniqueReferrers.size;

      return {
        success: true,
        data: {
          total: totalReferrals,
          active: activeReferrals,
          pending: pendingReferrals,
          totalReferrers,
        }
      };
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      return {
        success: false,
        error: error.message,
        data: {
          total: 0,
          active: 0,
          pending: 0,
          totalReferrers: 0,
        }
      };
    }
  }
};

/**
 * Notifications API functions
 */
export const notificationsAPI = {
  /**
   * Get all notifications from all users
   */
  async getAll() {
    try {
      const usersResponse = await fetchAPI('/users');
      if (!usersResponse.success) {
        throw new Error(usersResponse.error || 'Failed to fetch users');
      }

      const users = usersResponse.data || [];
      
      // Aggregate all notifications
      const allNotifications = [];
      
      for (const user of users) {
        if (user.notifications && user.notifications.length > 0) {
          for (const notification of user.notifications) {
            allNotifications.push({
              id: notification._id || Math.random().toString(),
              userId: user.userId,
              userName: user.nickname || `User${user.userId?.slice(-6)}`,
              userEmail: user.email,
              title: notification.title,
              message: notification.message,
              type: notification.type || 'info',
              read: notification.read || false,
              createdAt: notification.createdAt || new Date(),
            });
          }
        }
      }

      // Sort by most recent
      allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        success: true,
        data: allNotifications
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * Get notification statistics
   */
  async getStats() {
    try {
      const notificationsResponse = await this.getAll();
      if (!notificationsResponse.success) {
        throw new Error(notificationsResponse.error);
      }

      const notifications = notificationsResponse.data || [];
      const total = notifications.length;
      const unread = notifications.filter(n => !n.read).length;
      const read = total - unread;

      // Count by type
      const byType = notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {});

      return {
        success: true,
        data: {
          total,
          unread,
          read,
          byType,
        }
      };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return {
        success: false,
        error: error.message,
        data: {
          total: 0,
          unread: 0,
          read: 0,
          byType: {},
        }
      };
    }
  }
};

