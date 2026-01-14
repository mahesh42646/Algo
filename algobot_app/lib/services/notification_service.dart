import 'api_handler.dart';

class NotificationService {
  final ApiHandler _apiHandler = ApiHandler();

  Future<List<Map<String, dynamic>>> getNotifications(String userId) async {
    try {
      final response = await _apiHandler.get('/users/$userId/notifications');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] as List<dynamic>;
        return data.map((item) => item as Map<String, dynamic>).toList();
      }
      throw Exception(response.data['error'] ?? 'Failed to get notifications');
    } catch (e) {
      throw Exception('Failed to get notifications: $e');
    }
  }

  Future<void> markAsRead(String userId, String notificationId) async {
    try {
      await _apiHandler.put('/users/$userId/notifications/$notificationId/read');
    } catch (e) {
      throw Exception('Failed to mark notification as read: $e');
    }
  }

  Future<void> deleteNotification(String userId, String notificationId) async {
    try {
      await _apiHandler.delete('/users/$userId/notifications/$notificationId');
    } catch (e) {
      throw Exception('Failed to delete notification: $e');
    }
  }

  Future<void> clearAllNotifications(String userId) async {
    try {
      await _apiHandler.post('/users/$userId/notifications/clear-all');
    } catch (e) {
      throw Exception('Failed to clear notifications: $e');
    }
  }

  int getUnreadCount(List<Map<String, dynamic>> notifications) {
    return notifications.where((n) => n['read'] == false).length;
  }

  String formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  }
}
