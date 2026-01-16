import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:async';

enum AppTheme { light, dark, system }

class AppStateProvider extends ChangeNotifier {
  static AppStateProvider? _instance;
  factory AppStateProvider() {
    _instance ??= AppStateProvider._internal();
    return _instance!;
  }
  AppStateProvider._internal() {
    // Initialize synchronously with default values first
    _initConnectivitySync();
  }

  AppTheme _theme = AppTheme.system;
  String _language = 'en';
  bool _notificationsEnabled = true;
  bool _isOnline = true;
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;
  bool _isInitialized = false;

  AppTheme get theme => _theme;
  String get language => _language;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get isOnline => _isOnline;
  bool get isInitialized => _isInitialized;

  ThemeMode get themeMode {
    // Always return a valid ThemeMode, even during initialization
    switch (_theme) {
      case AppTheme.light:
        return ThemeMode.light;
      case AppTheme.dark:
        return ThemeMode.dark;
      case AppTheme.system:
        return ThemeMode.system;
    }
  }

  void _initConnectivitySync() {
    // Initialize connectivity synchronously with default values
    // The async connectivity check will happen later
    _isOnline = true; // Assume online by default
  }

  Future<void> init() async {
    if (_isInitialized) return;

    try {
      await _loadPreferences();
      _initConnectivity();
      _isInitialized = true;
      print('AppStateProvider fully initialized');
      notifyListeners();
    } catch (e) {
      print('Error initializing AppStateProvider: $e');
      // Continue with default values
      _isInitialized = true;
      notifyListeners();
    }
  }


  Future<void> _loadPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final themeString = prefs.getString('app_theme') ?? 'AppTheme.system';
      _theme = AppTheme.values.firstWhere(
        (e) => e.toString() == themeString,
        orElse: () => AppTheme.system,
      );
      _language = prefs.getString('app_language') ?? 'en';
      _notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
      print('Preferences loaded successfully');
    } catch (e) {
      print('Error loading preferences: $e');
      // Keep default values
    }
  }

  Future<void> _savePreferences() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_theme', _theme.toString());
    await prefs.setString('app_language', _language);
    await prefs.setBool('notifications_enabled', _notificationsEnabled);
  }

  void _initConnectivity() {
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen(
      (ConnectivityResult result) {
        final wasOnline = _isOnline;
        _isOnline = result != ConnectivityResult.none;
        if (wasOnline != _isOnline) {
          notifyListeners();
        }
      },
    );

    Connectivity().checkConnectivity().then((result) {
      _isOnline = result != ConnectivityResult.none;
      notifyListeners();
    });
  }

  Future<void> setTheme(AppTheme newTheme) async {
    if (_theme != newTheme) {
      _theme = newTheme;
      await _savePreferences();
      notifyListeners();
    }
  }

  Future<void> setLanguage(String newLanguage) async {
    if (_language != newLanguage) {
      _language = newLanguage;
      await _savePreferences();
      notifyListeners();
    }
  }

  Future<void> setNotificationsEnabled(bool enabled) async {
    if (_notificationsEnabled != enabled) {
      _notificationsEnabled = enabled;
      await _savePreferences();
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    super.dispose();
  }
}
