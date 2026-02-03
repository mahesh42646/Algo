import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_handler.dart';

/// Handles FCM push + local notifications. Shows app notifications in system tray (Android & iOS).
/// Trade-running notification shown when user has active trades.
class PushNotificationService {
  static const int _tradeRunningId = 9000;
  static const String _tradeRunningChannelId = 'trade_running';
  static const String _alertsChannelId = 'alerts';

  static final PushNotificationService _instance = PushNotificationService._();
  factory PushNotificationService() => _instance;

  PushNotificationService._();

  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();
  final ApiHandler _api = ApiHandler();
  bool _initialized = false;

  static Future<void> initialize() async {
    await _instance._init();
  }

  Future<void> _init() async {
    if (_initialized) return;

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
    );
    const settings = InitializationSettings(android: android, iOS: ios);
    await _local.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    if (Platform.isAndroid) {
      await _local
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(
        const AndroidNotificationChannel(
          _tradeRunningChannelId,
          'Trade running',
          description: 'Shows when you have an active trade',
          importance: Importance.low,
          playSound: false,
        ),
      );
      await _local
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(
        const AndroidNotificationChannel(
          _alertsChannelId,
          'Alerts',
          description: 'App notifications',
          importance: Importance.high,
        ),
      );
    }

    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    FirebaseMessaging.onMessage.listen(_onForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_onMessageOpenedApp);
    FirebaseMessaging.instance.getInitialMessage().then((msg) {
      if (msg != null) _handleMessage(msg);
    });

    _initialized = true;
  }

  void _onNotificationTap(NotificationResponse response) {
    // Could navigate by payload
  }

  Future<void> _onForegroundMessage(RemoteMessage message) async {
    final title = message.notification?.title ?? message.data['title'] ?? 'AlgoBot';
    final body = message.notification?.body ?? message.data['body'] ?? '';
    await _showLocalNotification(
      id: message.hashCode.abs() % 100000,
      title: title,
      body: body,
      channelId: _alertsChannelId,
    );
  }

  void _onMessageOpenedApp(RemoteMessage message) {
    _handleMessage(message);
  }

  void _handleMessage(RemoteMessage message) {
    // Optional: deep link from data
  }

  Future<void> _showLocalNotification({
    required int id,
    required String title,
    required String body,
    String channelId = _alertsChannelId,
  }) async {
    final android = AndroidNotificationDetails(
      channelId,
      channelId == _tradeRunningChannelId ? 'Trade running' : 'Alerts',
      channelDescription: channelId == _tradeRunningChannelId
          ? 'Active trade indicator'
          : 'App notifications',
      importance: Importance.high,
      priority: Priority.high,
    );
    const ios = DarwinNotificationDetails();
    final details = NotificationDetails(android: android, iOS: ios);
    await _local.show(id, title, body, details);
  }

  /// Register FCM token with backend so server can send push.
  Future<void> registerToken(String? userId) async {
    if (userId == null || userId.isEmpty) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) return;
      await _api.put(
        '/users/$userId/fcm-token',
        data: {'fcmToken': token},
      );
    } catch (_) {}
  }

  /// Call when active trades count/symbols change. Shows "Trade running" in notification center.
  Future<void> updateTradeRunningNotification({
    required int activeCount,
    List<String> symbols = const [],
  }) async {
    if (activeCount <= 0) {
      await _local.cancel(_tradeRunningId);
      return;
    }
    final title = 'AlgoBot';
    final body = activeCount == 1 && symbols.isNotEmpty
        ? 'Trade running: ${symbols.first}'
        : '$activeCount trade(s) running';
    const android = AndroidNotificationDetails(
      _tradeRunningChannelId,
      'Trade running',
      channelDescription: 'Active trade indicator',
      importance: Importance.low,
      priority: Priority.low,
      ongoing: true,
      autoCancel: false,
    );
    const ios = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
    );
    const details = NotificationDetails(android: android, iOS: ios);
    await _local.show(_tradeRunningId, title, body, details);
  }

  /// Call from app when user is logged in to register token.
  static Future<void> onUserLoggedIn(String userId) async {
    if (!_instance._initialized) await _instance._init();
    await _instance.registerToken(userId);
  }

  /// Update "trade running" system notification. Call when active trades load or change.
  static Future<void> updateTradeRunning({
    required int activeCount,
    List<String> symbols = const [],
  }) async {
    if (!_instance._initialized) await _instance._init();
    await _instance.updateTradeRunningNotification(
      activeCount: activeCount,
      symbols: symbols,
    );
  }
}

