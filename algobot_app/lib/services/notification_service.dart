import 'api_handler.dart';

class NotificationService {
  final ApiHandler _apiHandler = ApiHandler();

  Future<List<Map<String, dynamic>>> getNotifications(String userId) async {
    try {
      final response = await _apiHandler.get('/users/$userId/notifications');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] as List<dynamic>? ?? [];
        return data.map((item) {
          final map = Map<String, dynamic>.from(item as Map);
          if (map['_id'] != null && map['_id'].runtimeType != String) {
            map['_id'] = map['_id'].toString();
          }
          return map;
        }).toList();
      }
      throw Exception(response.data?['error']?.toString() ?? 'Failed to get notifications');
    } catch (e) {
      rethrow;
    }
  }

  Future<void> markAsRead(String userId, String notificationId) async {
    final response = await _apiHandler.put('/users/$userId/notifications/$notificationId/read');
    if (response.statusCode != 200) {
      throw Exception(response.data?['error']?.toString() ?? 'Failed to mark as read');
    }
  }

  Future<void> deleteNotification(String userId, String notificationId) async {
    final response = await _apiHandler.delete('/users/$userId/notifications/$notificationId');
    if (response.statusCode != 200) {
      throw Exception(response.data?['error']?.toString() ?? 'Failed to delete');
    }
  }

  Future<void> markAllAsRead(String userId) async {
    final response = await _apiHandler.put('/users/$userId/notifications/mark-all-read');
    if (response.statusCode != 200) {
      throw Exception(response.data?['error']?.toString() ?? 'Failed to mark all as read');
    }
  }

  Future<void> clearAllNotifications(String userId) async {
    final response = await _apiHandler.post('/users/$userId/notifications/clear-all');
    if (response.statusCode != 200) {
      throw Exception(response.data?['error']?.toString() ?? 'Failed to clear');
    }
  }

  int getUnreadCount(List<Map<String, dynamic>> notifications) {
    return notifications.where((n) => n['read'] != true).length;
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

  String formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final sameDay = now.year == dateTime.year && now.month == dateTime.month && now.day == dateTime.day;
    if (sameDay) {
      return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    }
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}
