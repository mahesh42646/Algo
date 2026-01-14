import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:async';

enum AppTheme { light, dark, system }

class AppStateProvider extends ChangeNotifier {
  static final AppStateProvider _instance = AppStateProvider._internal();
  factory AppStateProvider() => _instance;
  AppStateProvider._internal() {
    _init();
  }

  AppTheme _theme = AppTheme.system;
  String _language = 'en';
  bool _notificationsEnabled = true;
  bool _isOnline = true;
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;

  AppTheme get theme => _theme;
  String get language => _language;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get isOnline => _isOnline;

  ThemeMode get themeMode {
    switch (_theme) {
      case AppTheme.light:
        return ThemeMode.light;
      case AppTheme.dark:
        return ThemeMode.dark;
      case AppTheme.system:
        return ThemeMode.system;
    }
  }

  Future<void> _init() async {
    await _loadPreferences();
    _initConnectivity();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final themeString = prefs.getString('app_theme') ?? 'AppTheme.system';
    _theme = AppTheme.values.firstWhere(
      (e) => e.toString() == themeString,
      orElse: () => AppTheme.system,
    );
    _language = prefs.getString('app_language') ?? 'en';
    _notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
    notifyListeners();
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
