import 'dart:async';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/env.dart';
import 'auth_service.dart';

/// Realtime updates via Socket.IO. Connect when user is logged in; listen to streams to refresh UI.
class SocketService {
  static final SocketService _instance = SocketService._();
  factory SocketService() => _instance;

  SocketService._();

  final AuthService _auth = AuthService();
  io.Socket? _socket;
  bool _connecting = false;

  final StreamController<Map<String, dynamic>> _balanceController = StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<List<dynamic>> _notificationsController = StreamController<List<dynamic>>.broadcast();
  final StreamController<void> _statsController = StreamController<void>.broadcast();
  final StreamController<void> _activeTradesController = StreamController<void>.broadcast();
  final StreamController<void> _tradeHistoryController = StreamController<void>.broadcast();
  final StreamController<List<dynamic>> _favoritesController = StreamController<List<dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get balanceUpdates => _balanceController.stream;
  Stream<List<dynamic>> get notificationsUpdates => _notificationsController.stream;
  Stream<void> get statsUpdates => _statsController.stream;
  Stream<void> get activeTradesUpdates => _activeTradesController.stream;
  Stream<void> get tradeHistoryUpdates => _tradeHistoryController.stream;
  Stream<List<dynamic>> get favoritesUpdates => _favoritesController.stream;

  bool get isConnected => _socket?.connected ?? false;

  static String _token(String userId) {
    final secret = Env.socketSecret;
    if (secret.isEmpty) return '';
    final bytes = utf8.encode(userId + secret);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  void connect() {
    final userId = _auth.currentUser?.uid;
    if (userId == null || userId.isEmpty) return;
    if (_socket?.connected == true || _connecting) return;

    _connecting = true;
    final token = _token(userId);

    _socket = io.io(
      Env.backendBaseUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(1000)
          .setAuth({'userId': userId, 'token': token})
          .build(),
    );

    _socket!
      ..onConnect((_) {
        _connecting = false;
        if (kDebugMode) {
          print('[SOCKET] Connected');
        }
      })
      ..onDisconnect((_) {
        _connecting = false;
        if (kDebugMode) {
          print('[SOCKET] Disconnected');
        }
      })
      ..on('error', (data) {
        _connecting = false;
        if (kDebugMode && data != null) {
          print('[SOCKET] Error: $data');
        }
      })
      ..on('connected', (_) {})
      ..on('user:balance', (data) {
        if (data is Map) {
          _balanceController.add(Map<String, dynamic>.from(data as Map));
        }
      })
      ..on('user:notifications', (data) {
        if (data is List) {
          _notificationsController.add(List<dynamic>.from(data));
        }
      })
      ..on('user:stats', (_) => _statsController.add(null))
      ..on('user:activeTrades', (_) => _activeTradesController.add(null))
      ..on('user:tradeHistory', (_) => _tradeHistoryController.add(null))
      ..on('user:favorites', (data) {
        if (data is List) {
          _favoritesController.add(List<dynamic>.from(data));
        }
      });
  }

  void disconnect() {
    _connecting = false;
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _balanceController.close();
    _notificationsController.close();
    _statsController.close();
    _activeTradesController.close();
    _tradeHistoryController.close();
    _favoritesController.close();
  }
}
