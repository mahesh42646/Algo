import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/env.dart';
import 'api_handler.dart';

const String _keyLastAppliedUpdatedAt = 'app_config_last_applied_updated_at';

/// Fetches and caches app config from backend (app name, icon, theme, language, charges).
/// When backend updatedAt is newer than last applied, sets updateAvailable and shows update dialog.
class AppConfigService extends ChangeNotifier {
  static final AppConfigService _instance = AppConfigService._();
  factory AppConfigService() => _instance;

  AppConfigService._();

  final ApiHandler _api = ApiHandler();
  AppConfig? _config;
  AppConfig? _pendingConfig;
  bool _loaded = false;
  bool _updateAvailable = false;
  String _pendingUpdateNotes = '';
  int _restartKey = 0;

  AppConfig? get config => _config;
  bool get loaded => _loaded;
  bool get updateAvailable => _updateAvailable;
  String get pendingUpdateNotes => _pendingUpdateNotes;
  int get restartKey => _restartKey;

  String get appName => _config?.appName ?? Env.appName;
  String get appIconUrl => _config?.appIconUrl ?? '';
  String get theme => _config?.theme ?? 'system';
  String get language => _config?.language ?? 'en';
  String get platformChargeType => _config?.platformChargeType ?? 'percent';
  double get platformChargeValue => _config?.platformChargeValue ?? 0.3;

  ThemeMode get themeMode {
    switch (_config?.theme) {
      case 'light': return ThemeMode.light;
      case 'dark': return ThemeMode.dark;
      default: return ThemeMode.system;
    }
  }

  static AppConfig _configFromMap(Map<dynamic, dynamic> d) {
    return AppConfig(
      appName: (d['appName'] as String?) ?? Env.appName,
      appIconUrl: (d['appIconUrl'] as String?) ?? '',
      theme: (d['theme'] as String?) ?? 'system',
      language: (d['language'] as String?) ?? 'en',
      platformChargeType: (d['platformChargeType'] as String?) ?? 'percent',
      platformChargeValue: (d['platformChargeValue'] as num?)?.toDouble() ?? 0.3,
      updatedAt: d['updatedAt'] as String?,
      updateNotes: d['updateNotes'] as String? ?? '',
    );
  }

  /// Call on app startup and optionally on resume.
  Future<void> fetch() async {
    try {
      final response = await _api.get('/app-config');
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data is Map ? response.data as Map<String, dynamic> : null;
        final d = data?['data'];
        if (d is Map) {
          final map = Map<dynamic, dynamic>.from(d);
          final newConfig = _configFromMap(map);
          final updatedAt = newConfig.updatedAt;

          final prefs = await SharedPreferences.getInstance();
          final lastApplied = prefs.getString(_keyLastAppliedUpdatedAt);
          final hasLastApplied = lastApplied != null && lastApplied.isNotEmpty;
          final isNewer = updatedAt != null &&
              updatedAt.isNotEmpty &&
              hasLastApplied &&
              updatedAt != lastApplied;

          if (isNewer) {
            _pendingConfig = newConfig;
            _pendingUpdateNotes = newConfig.updateNotes;
            _updateAvailable = true;
          } else {
            _config = newConfig;
            _loaded = true;
            _updateAvailable = false;
            _pendingConfig = null;
            _pendingUpdateNotes = '';
            if (updatedAt != null && updatedAt.isNotEmpty && !hasLastApplied) {
              await prefs.setString(_keyLastAppliedUpdatedAt, updatedAt);
            }
          }
          if (!_loaded && _config == null) {
            _config = newConfig;
            _loaded = true;
          }
          notifyListeners();
        }
      }
    } catch (e) {
      if (kDebugMode) debugPrint('[AppConfig] fetch error: $e');
    }
  }

  /// Apply pending config (after user accepts update), persist last applied, trigger rebuild.
  Future<void> applyUpdate() async {
    if (_pendingConfig == null) return;
    _config = _pendingConfig;
    _pendingConfig = null;
    _updateAvailable = false;
    final updatedAt = _config!.updatedAt;
    if (updatedAt != null && updatedAt.isNotEmpty) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyLastAppliedUpdatedAt, updatedAt);
    }
    _pendingUpdateNotes = '';
    _restartKey++;
    notifyListeners();
  }
}

class AppConfig {
  final String appName;
  final String appIconUrl;
  final String theme;
  final String language;
  final String platformChargeType;
  final double platformChargeValue;
  final String? updatedAt;
  final String updateNotes;

  AppConfig({
    required this.appName,
    required this.appIconUrl,
    required this.theme,
    required this.language,
    required this.platformChargeType,
    required this.platformChargeValue,
    this.updatedAt,
    this.updateNotes = '',
  });
}
