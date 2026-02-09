import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/notification_service.dart';
import '../services/socket_service.dart';
import '../screens/api_binding_screen.dart';
import 'tab_navigator_scope.dart';

enum NotificationFilter { unread, all }

/// Resolves which tab/screen a notification relates to. Returns tab index 0-4, or -1 to push a route.
int? getNotificationTargetTab(Map<String, dynamic> notification) {
  final title = (notification['title'] ?? '').toString().toLowerCase();
  final message = (notification['message'] ?? '').toString().toLowerCase();
  final text = '$title $message';

  if (text.contains('profile') || text.contains('mine') || text.contains('wallet') && text.contains('balance')) return 4;
  if (text.contains('history') || text.contains('trade') && text.contains('stop') || text.contains('transaction') || text.contains('profit') || text.contains('loss') || text.contains('completed')) return 2;
  if (text.contains('strategy') || text.contains('algo') || text.contains('trading') && (text.contains('start') || text.contains('signal'))) return 1;
  if (text.contains('favorite') || text.contains('favourite')) return 3;
  if (text.contains('api') || text.contains('binding') || text.contains('key')) return -1;
  return null;
}

class NotificationPanel extends StatefulWidget {
  const NotificationPanel({
    super.key,
    required this.onNavigateToTab,
    this.onClose,
  });

  final void Function(int index) onNavigateToTab;
  final VoidCallback? onClose;

  @override
  State<NotificationPanel> createState() => _NotificationPanelState();
}

class _NotificationPanelState extends State<NotificationPanel> {
  final NotificationService _notificationService = NotificationService();
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  NotificationFilter _filter = NotificationFilter.unread;
  StreamSubscription<List<dynamic>>? _socketSub;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _socketSub = SocketService().notificationsUpdates.listen((data) {
      if (!mounted) return;
      final list = data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      setState(() => _notifications = list);
    });
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        final list = await _notificationService.getNotifications(user.uid);
        if (mounted) setState(() {
          _notifications = list;
          _isLoading = false;
        });
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _notificationId(Map<String, dynamic> n) {
    final id = n['_id'] ?? n['id'];
    if (id == null) return '';
    return id.toString();
  }

  Future<void> _markAllAsRead() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    try {
      await _notificationService.markAllAsRead(user.uid);
      await _loadNotifications();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('All marked as read')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Theme.of(context).colorScheme.error),
        );
      }
    }
  }

  Future<void> _deleteOne(String notificationId) async {
    if (notificationId.isEmpty) return;
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    try {
      await _notificationService.deleteNotification(user.uid, notificationId);
      await _loadNotifications();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error deleting: $e'), backgroundColor: Theme.of(context).colorScheme.error),
        );
      }
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_filter == NotificationFilter.unread) {
      return _notifications.where((n) => n['read'] != true).toList();
    }
    return List.from(_notifications);
  }

  void _openDetail(Map<String, dynamic> notification, VoidCallback onPop) async {
    final user = FirebaseAuth.instance.currentUser;
    final id = _notificationId(notification);
    if (user != null && id.isNotEmpty && notification['read'] != true) {
      try {
        await _notificationService.markAsRead(user.uid, id);
        await _loadNotifications();
      } catch (_) {}
    }
    if (!mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (ctx) => _NotificationDetailScreen(
          notification: notification,
          notificationService: _notificationService,
          onNavigateToTab: widget.onNavigateToTab,
          onPop: onPop,
        ),
      ),
    );
  }

  void _navigateFromNotification(Map<String, dynamic> notification) {
    widget.onNavigateToTab(-1);
    final tab = getNotificationTargetTab(notification);
    if (tab == null) return;
    if (tab == -1) {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => ApiBindingScreen()));
      return;
    }
    TabNavigatorScope.maybeOf(context)?.switchToTab(tab);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final list = _filtered;
    final unreadCount = _notifications.where((n) => n['read'] != true).length;

    return Material(
      color: theme.scaffoldBackgroundColor,
      borderRadius: BorderRadius.circular(16),
      elevation: 8,
      shadowColor: theme.shadowColor.withOpacity(0.2),
      child: Container(
        width: 320,
        height: 520,
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.dividerColor.withOpacity(0.5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildHeader(theme, unreadCount),
            _buildFilterBar(theme),
            if (_isLoading)
              const Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator())
            else if (list.isEmpty)
              Expanded(child: _buildEmpty(theme))
            else
              Expanded(
                child: ListView.builder(
                  padding: EdgeInsets.zero,
                  itemCount: list.length,
                  itemBuilder: (context, index) => _buildItem(theme, list[index]),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme, int unreadCount) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withOpacity(0.3),
        borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
        border: Border(bottom: BorderSide(color: theme.dividerColor.withOpacity(0.5))),
      ),
      child: Row(
        children: [
          Text('Notifications', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const Spacer(),
          if (unreadCount > 0)
            TextButton(
              onPressed: _markAllAsRead,
              child: Text('Mark all read', style: TextStyle(fontSize: 12, color: theme.colorScheme.primary)),
            ),
        ],
      ),
    );
  }

  Widget _buildFilterBar(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          ChoiceChip(
            label: const Text('Unread'),
            selected: _filter == NotificationFilter.unread,
            onSelected: (_) => setState(() => _filter = NotificationFilter.unread),
            selectedColor: theme.colorScheme.primaryContainer,
          ),
          const SizedBox(width: 8),
          ChoiceChip(
            label: const Text('All'),
            selected: _filter == NotificationFilter.all,
            onSelected: (_) => setState(() => _filter = NotificationFilter.all),
            selectedColor: theme.colorScheme.primaryContainer,
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.notifications_none, size: 48, color: theme.colorScheme.outline),
          const SizedBox(height: 16),
          Text(
            _filter == NotificationFilter.unread ? 'No unread notifications' : 'No notifications',
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildItem(ThemeData theme, Map<String, dynamic> notification) {
    final isRead = notification['read'] == true;
    final type = (notification['type'] ?? 'info') as String;
    DateTime createdAt = DateTime.now();
    try {
      if (notification['createdAt'] != null) {
        createdAt = DateTime.parse(notification['createdAt'].toString());
      }
    } catch (_) {}
    final id = _notificationId(notification);
    final typeColor = _typeColor(type);

    return Material(
      color: isRead ? theme.scaffoldBackgroundColor : theme.colorScheme.primaryContainer.withOpacity(0.15),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: typeColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(_typeIcon(type), color: typeColor, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: InkWell(
                onTap: () => _openDetail(notification, _loadNotifications),
                borderRadius: BorderRadius.circular(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      notification['title']?.toString() ?? '',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: isRead ? FontWeight.normal : FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      notification['message']?.toString() ?? '',
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          _notificationService.formatTimeAgo(createdAt),
                          style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.outline),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Read more',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(Icons.arrow_forward_ios, size: 10, color: theme.colorScheme.primary),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 4),
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => _deleteOne(id),
                borderRadius: BorderRadius.circular(20),
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Icon(Icons.close, size: 20, color: theme.colorScheme.onSurfaceVariant),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'success': return Colors.green;
      case 'warning': return Colors.orange;
      case 'error': return Colors.red;
      default: return Colors.blue;
    }
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'success': return Icons.check_circle;
      case 'warning': return Icons.warning;
      case 'error': return Icons.error;
      default: return Icons.info;
    }
  }
}

class _NotificationDetailScreen extends StatelessWidget {
  const _NotificationDetailScreen({
    required this.notification,
    required this.notificationService,
    required this.onNavigateToTab,
    required this.onPop,
  });

  final Map<String, dynamic> notification;
  final NotificationService notificationService;
  final void Function(int index) onNavigateToTab;
  final VoidCallback onPop;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final type = (notification['type'] ?? 'info') as String;
    DateTime createdAt = DateTime.now();
    try {
      if (notification['createdAt'] != null) {
        createdAt = DateTime.parse(notification['createdAt'].toString());
      }
    } catch (_) {}

    Color typeColor;
    switch (type) {
      case 'success': typeColor = Colors.green; break;
      case 'warning': typeColor = Colors.orange; break;
      case 'error': typeColor = Colors.red; break;
      default: typeColor = theme.colorScheme.primary;
    }

    final tab = getNotificationTargetTab(notification);
    final canNavigate = tab != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            onPop();
            Navigator.of(context).pop();
          },
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: typeColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    type == 'success' ? Icons.check_circle : type == 'warning' ? Icons.warning : type == 'error' ? Icons.error : Icons.info,
                    color: typeColor,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    notification['title']?.toString() ?? '',
                    style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              notificationService.formatDateTime(createdAt),
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline),
            ),
            const SizedBox(height: 20),
            Text(
              notification['message']?.toString() ?? '',
              style: theme.textTheme.bodyLarge,
            ),
            if (canNavigate) ...[
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    onPop();
                    onNavigateToTab(tab!);
                  },
                  icon: const Icon(Icons.open_in_new, size: 20),
                  label: Text(_navigateLabel(tab!)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _navigateLabel(int tab) {
    switch (tab) {
      case 0: return 'Go to Home';
      case 1: return 'Go to Strategy';
      case 2: return 'Go to History';
      case 3: return 'Go to Favorites';
      case 4: return 'Go to Profile';
      case -1: return 'Go to API Binding';
      default: return 'Open';
    }
  }
}
