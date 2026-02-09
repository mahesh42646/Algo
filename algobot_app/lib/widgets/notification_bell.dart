import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'notification_panel.dart';
import '../services/notification_service.dart';
import '../services/socket_service.dart';
import '../screens/api_binding_screen.dart';
import 'tab_navigator_scope.dart';

class NotificationBell extends StatefulWidget {
  const NotificationBell({super.key});

  @override
  State<NotificationBell> createState() => _NotificationBellState();
}

class _NotificationBellState extends State<NotificationBell> {
  final NotificationService _notificationService = NotificationService();
  int _unreadCount = 0;
  bool _isLoading = true;
  Timer? _refreshTimer;
  StreamSubscription<List<dynamic>>? _notifSub;

  @override
  void initState() {
    super.initState();
    _loadNotificationCount();
    _startPeriodicRefresh();
    _notifSub = SocketService().notificationsUpdates.listen((_) => _loadNotificationCount());
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _notifSub?.cancel();
    super.dispose();
  }

  void _startPeriodicRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      if (mounted) _loadNotificationCount();
      else timer.cancel();
    });
  }

  Future<void> _loadNotificationCount() async {
    if (!mounted) return;
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        final notifications = await _notificationService.getNotifications(user.uid);
        if (mounted) setState(() {
          _unreadCount = _notificationService.getUnreadCount(notifications);
          _isLoading = false;
        });
      } else if (mounted) setState(() => _isLoading = false);
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showNotificationPanel(BuildContext context) {
    final RenderBox? button = context.findRenderObject() as RenderBox?;
    final overlay = Overlay.of(context).context.findRenderObject() as RenderBox?;
    if (button == null || overlay == null) return;

    final buttonPosition = button.localToGlobal(Offset.zero);
    final buttonSize = button.size;
    final theme = Theme.of(context);

    showDialog<int?>(
      context: context,
      barrierColor: theme.colorScheme.scrim.withOpacity(0.3),
      builder: (dialogContext) => Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned.fill(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => Navigator.of(dialogContext).pop(),
              child: const SizedBox.expand(),
            ),
          ),
          Positioned(
            right: 16,
            top: buttonPosition.dy + buttonSize.height + 8,
            child: Material(
              type: MaterialType.transparency,
              child: NotificationPanel(
                key: ValueKey(DateTime.now().millisecondsSinceEpoch),
                onNavigateToTab: (index) => Navigator.of(dialogContext).pop(index),
              ),
            ),
          ),
        ],
      ),
    ).then((result) {
      if (!mounted) return;
      _loadNotificationCount();
      final int? tabResult = result;
      if (tabResult != null) {
        final scope = TabNavigatorScope.maybeOf(context);
        if (tabResult == -1) {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => ApiBindingScreen()),
          );
        } else if (scope != null && tabResult >= 0 && tabResult <= 4) {
          scope.switchToTab(tabResult);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          onPressed: () => _showNotificationPanel(context),
        ),
        if (_unreadCount > 0)
          Positioned(
            right: 8,
            top: 8,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: theme.colorScheme.error,
                shape: BoxShape.circle,
              ),
              constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
              child: Text(
                _unreadCount > 99 ? '99+' : (_unreadCount > 9 ? '9+' : '$_unreadCount'),
                style: TextStyle(
                  color: theme.colorScheme.onError,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}
