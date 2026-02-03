import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/notification_service.dart';

class NotificationPanel extends StatefulWidget {
  const NotificationPanel({super.key});

  @override
  State<NotificationPanel> createState() => _NotificationPanelState();
}

class _NotificationPanelState extends State<NotificationPanel> {
  final NotificationService _notificationService = NotificationService();
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    // Refresh notifications when panel is shown
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadNotifications();
    });
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        final notifications = await _notificationService.getNotifications(user.uid);
        setState(() {
          _notifications = notifications;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteNotification(String notificationId) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null && notificationId.isNotEmpty) {
        await _notificationService.deleteNotification(user.uid, notificationId);
        await _loadNotifications();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error deleting notification: $e')),
        );
      }
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        await _notificationService.markAllAsRead(user.uid);
        await _loadNotifications();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('All marked as read')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _clearAll() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        await _notificationService.clearAllNotifications(user.uid);
        await _loadNotifications();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('All notifications cleared')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error clearing: $e')),
        );
      }
    }
  }

  void _handleNotificationTap(Map<String, dynamic> notification) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    // Mark as read
    final notificationId = notification['_id']?.toString() ?? 
                           notification['id']?.toString() ?? '';
    if (notificationId.isNotEmpty && notification['read'] != true) {
      try {
        await _notificationService.markAsRead(user.uid, notificationId);
        await _loadNotifications();
      } catch (e) {
        // Ignore mark as read errors
      }
    }

    // Navigate based on notification content
    final title = (notification['title'] ?? '').toString().toLowerCase();
    final message = (notification['message'] ?? '').toString().toLowerCase();
    
    // Close notification panel first
    if (mounted) {
      Navigator.of(context).pop();
    }

    // Navigate to appropriate screen
    if (title.contains('profile') || message.contains('profile')) {
      // Navigate to mine page
      Navigator.of(context).pushNamed('/mine');
    } else if (title.contains('algo') && (title.contains('start') || message.contains('start'))) {
      // Navigate to algo trading screen or strategy page
      Navigator.of(context).pushNamed('/strategy');
    } else if (title.contains('stop') || message.contains('stop') || title.contains('trade')) {
      // Navigate to strategy page
      Navigator.of(context).pushNamed('/strategy');
    } else if (title.contains('admin') || message.contains('admin')) {
      // Admin notification - just mark as seen (already done above)
      return;
    }
    // Default: just mark as seen (already done above)
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'success':
        return Colors.green;
      case 'warning':
        return Colors.orange;
      case 'error':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'success':
        return Icons.check_circle;
      case 'warning':
        return Icons.warning;
      case 'error':
        return Icons.error;
      default:
        return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadOnly = _notifications.where((n) => n['read'] != true).toList();
    return Material(
      color: Colors.transparent,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxHeight: 500),
        child: Container(
          width: 320,
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.max,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                  border: Border(
                    bottom: BorderSide(
                      color: Colors.grey[200]!,
                      width: 1,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Notifications',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (unreadOnly.isNotEmpty)
                          TextButton(
                            onPressed: _markAllAsRead,
                            child: const Text('Mark all read', style: TextStyle(fontSize: 12)),
                          ),
                        if (_notifications.isNotEmpty)
                          TextButton(
                            onPressed: _clearAll,
                            child: const Text('Clear All', style: TextStyle(fontSize: 12)),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              if (_isLoading)
                const Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                )
              else if (unreadOnly.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      Icon(
                        Icons.notifications_none,
                        size: 48,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _notifications.isEmpty
                            ? 'No notifications'
                            : 'No unread notifications',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                )
              else
                Expanded(
                  child: ListView.builder(
                    itemCount: unreadOnly.length,
                    itemBuilder: (context, index) {
                      final notification = unreadOnly[index];
                    final isRead = notification['read'] == true;
                    final type = notification['type'] ?? 'info';
                    DateTime createdAt = DateTime.now();
                    try {
                      if (notification['createdAt'] != null) {
                        final dateStr = notification['createdAt'].toString();
                        createdAt = DateTime.parse(dateStr);
                      }
                    } catch (e) {
                      createdAt = DateTime.now();
                    }

                    return Container(
                      decoration: BoxDecoration(
                        color: isRead
                            ? Theme.of(context).scaffoldBackgroundColor
                            : Theme.of(context).colorScheme.primary.withOpacity(0.1),
                        border: Border(
                          bottom: BorderSide(
                            color: Theme.of(context).dividerColor,
                            width: 0.5,
                          ),
                        ),
                      ),
                      child: ListTile(
                        dense: true,
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: _getTypeColor(type).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            _getTypeIcon(type),
                            color: _getTypeColor(type),
                            size: 20,
                          ),
                        ),
                        title: Text(
                          notification['title'] ?? '',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isRead ? FontWeight.normal : FontWeight.w600,
                          ),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(
                              notification['message'] ?? '',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[700],
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _notificationService.formatTimeAgo(createdAt),
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.close, size: 18),
                          onPressed: () async {
                            final notificationId = notification['_id']?.toString() ?? 
                                                   notification['id']?.toString() ?? '';
                            if (notificationId.isNotEmpty) {
                              // Mark as read before deleting
                              final user = FirebaseAuth.instance.currentUser;
                              if (user != null && !isRead) {
                                try {
                                  await _notificationService.markAsRead(user.uid, notificationId);
                                } catch (e) {
                                  // Ignore mark as read errors
                                }
                              }
                              await _deleteNotification(notificationId);
                            }
                          },
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                        onTap: () => _handleNotificationTap(notification),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    ),
    );
  }
}
